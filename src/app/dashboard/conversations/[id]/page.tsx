import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedModes = new Set(["ai", "human", "paused"]);

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    </main>
  );
}
