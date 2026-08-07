import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import twilio from "twilio";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedModes = new Set(["ai", "human", "paused"]);

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { id } = await params;
  const notice = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id,organization_id,contact_id,mode,last_message_at")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) redirect("/dashboard");
  const organizationId = conversation.organization_id;
  const actorUserId = user.id;

  const [organizationResult, contactResult, messagesResult] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", conversation.organization_id).single(),
    supabase.from("contacts").select("first_name,last_name,phone,email").eq("id", conversation.contact_id).single(),
    supabase
      .from("messages")
      .select("id,direction,body,status,ai_generated,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const contact = contactResult.data;
  const contactName = [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || contact?.phone || "Customer";

  async function updateMode(formData: FormData) {
    "use server";
    const mode = String(formData.get("mode") ?? "");
    if (!allowedModes.has(mode)) return;

    const serverSupabase = await createSupabaseServer();
    const { data: updated } = await serverSupabase
      .from("conversations")
      .update({ mode })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (updated) {
      await serverSupabase.from("audit_logs").insert({
        organization_id: organizationId,
        actor_user_id: actorUserId,
        action: "conversation_mode_changed",
        entity_type: "conversation",
        entity_id: id,
        metadata: { mode },
      });
    }

    revalidatePath(`/dashboard/conversations/${id}`);
    revalidatePath("/dashboard");
  }

  async function sendReply(formData: FormData) {
    "use server";
    const body = String(formData.get("body") ?? "").trim();
    if (!body || body.length > 1600) {
      redirect(`/dashboard/conversations/${id}?error=invalid-message`);
    }

    const serverSupabase = await createSupabaseServer();
    const { data: { user: sendingUser } } = await serverSupabase.auth.getUser();
    if (!sendingUser) redirect("/login");

    const { data: authorizedConversation } = await serverSupabase
      .from("conversations")
      .select("id,organization_id,contact_id")
      .eq("id", id)
      .maybeSingle();
    if (!authorizedConversation) redirect("/dashboard");

    const admin = createSupabaseAdmin();
    const [{ data: sendingOrganization }, { data: sendingContact }] = await Promise.all([
      admin.from("organizations").select("name,sms_number").eq("id", authorizedConversation.organization_id).single(),
      admin.from("contacts").select("phone").eq("id", authorizedConversation.contact_id).single(),
    ]);

    if (!sendingOrganization?.sms_number || !sendingContact?.phone) {
      redirect(`/dashboard/conversations/${id}?error=number-not-connected`);
    }

    const { data: consent } = await admin
      .from("sms_consents")
      .select("status")
      .eq("phone", sendingContact.phone)
      .maybeSingle();
    if (consent?.status === "opted_out") {
      redirect(`/dashboard/conversations/${id}?error=opted-out`);
    }

    try {
      const env = getServerEnv();
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const sent = await client.messages.create({
        body,
        from: sendingOrganization.sms_number,
        to: sendingContact.phone,
        statusCallback: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
      });

      await Promise.all([
        admin.from("messages").insert({
          organization_id: authorizedConversation.organization_id,
          conversation_id: id,
          direction: "outbound",
          body,
          provider_message_id: sent.sid,
          status: sent.status || "queued",
          ai_generated: false,
        }),
        admin.from("conversations").update({
          mode: "human",
          assigned_user_id: sendingUser.id,
          last_message_at: new Date().toISOString(),
        }).eq("id", id),
        admin.from("audit_logs").insert({
          organization_id: authorizedConversation.organization_id,
          actor_user_id: sendingUser.id,
          action: "manual_sms_sent",
          entity_type: "conversation",
          entity_id: id,
          metadata: { message_sid: sent.sid },
        }),
      ]);
    } catch {
      redirect(`/dashboard/conversations/${id}?error=send-failed`);
    }

    revalidatePath(`/dashboard/conversations/${id}`);
    revalidatePath("/dashboard");
    redirect(`/dashboard/conversations/${id}?sent=1`);
  }

  return (
    <main className="conversation-page">
      <header className="conversation-header">
        <div>
          <a className="back-link" href="/dashboard">← Back to command center</a>
          <p className="eyebrow">{organizationResult.data?.name ?? "ORGANIZATION"}</p>
          <h1>{contactName}</h1>
          <p>{contact?.phone}{contact?.email ? ` · ${contact.email}` : ""}</p>
        </div>
        <form className="mode-controls" action={updateMode}>
          <button className={conversation.mode === "ai" ? "active" : ""} name="mode" value="ai">AI active</button>
          <button className={conversation.mode === "human" ? "active" : ""} name="mode" value="human">Human takeover</button>
          <button className={conversation.mode === "paused" ? "active" : ""} name="mode" value="paused">Pause</button>
        </form>
      </header>

      <section className="message-thread" aria-label="Conversation history">
        {messagesResult.data?.length ? messagesResult.data.map((message) => (
          <article className={`message-bubble ${message.direction}`} key={message.id}>
            <div>
              <span>{message.direction === "inbound" ? contactName : message.ai_generated ? "Command AI" : "Bay to Bay team"}</span>
              <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
            </div>
            <p>{message.body}</p>
            <small>{message.status}</small>
          </article>
        )) : (
          <div className="empty-thread">No messages have been recorded in this conversation yet.</div>
        )}
      </section>

      <section className="reply-panel" aria-label="Send a text message">
        <div>
          <p className="eyebrow">HUMAN REPLY</p>
          <h2>Text {contactName}</h2>
          <p>Sending a reply automatically places this conversation in human takeover mode.</p>
        </div>
        {notice.sent ? <p className="reply-notice success">Message sent successfully.</p> : null}
        {notice.error === "invalid-message" ? <p className="reply-notice error">Enter a message of 1–1,600 characters.</p> : null}
        {notice.error === "number-not-connected" ? <p className="reply-notice error">This company’s Twilio number is not connected yet.</p> : null}
        {notice.error === "opted-out" ? <p className="reply-notice error">This customer opted out and cannot be texted.</p> : null}
        {notice.error === "send-failed" ? <p className="reply-notice error">The message could not be sent. Check the Twilio connection and try again.</p> : null}
        <form className="reply-form" action={sendReply}>
          <label htmlFor="reply-body">Message</label>
          <textarea id="reply-body" name="body" maxLength={1600} required placeholder="Type your reply…" />
          <button type="submit">Send text</button>
        </form>
      </section>
    </main>
  );
}
