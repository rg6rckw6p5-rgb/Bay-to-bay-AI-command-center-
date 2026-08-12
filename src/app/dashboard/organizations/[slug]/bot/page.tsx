import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function defaultInstructions(name: string, kind: "business" | "nonprofit") {
  if (kind === "nonprofit") {
    return `You are the communication assistant for ${name}. Be warm, respectful, and trauma-informed. Help people understand available programs, collect only the information needed for follow-up, and never promise aid or eligibility. Escalate emergencies, safety concerns, private case details, and requests for a staff member. Always honor STOP and other opt-out requests.`;
  }
  return `You are the customer communication assistant for ${name}. Respond quickly, professionally, and conversationally. Identify the requested service, property address, urgency, preferred estimate time, and whether the customer can share photos. Never invent pricing, availability, licensing claims, or guarantees. Escalate emergencies, complaints, unusual requests, and requests for a human. Always honor STOP and other opt-out requests.`;
}

export default async function BotConfigurationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: organization } = await supabase
    .from("organizations")
    .select("id,name,slug,kind,sms_number,ai_instructions,active")
    .eq("slug", slug)
    .maybeSingle();
  if (!organization) notFound();
  const organizationId = organization.id;

  async function saveBotConfiguration(formData: FormData) {
    "use server";
    const serverSupabase = await createSupabaseServer();
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser();
    if (!currentUser) redirect("/login");

    const instructions = String(formData.get("instructions") ?? "").trim();
    if (instructions.length < 80 || instructions.length > 8000) {
      redirect(`/dashboard/organizations/${slug}/bot?error=instructions`);
    }

    const { error } = await serverSupabase
      .from("organizations")
      .update({ ai_instructions: instructions, active: formData.get("active") === "on" })
      .eq("id", organizationId);
    if (error) redirect(`/dashboard/organizations/${slug}/bot?error=save`);

    revalidatePath(`/dashboard/organizations/${slug}`);
    redirect(`/dashboard/organizations/${slug}/bot?saved=1`);
  }

  const instructions = organization.ai_instructions || defaultInstructions(organization.name, organization.kind);

  return (
    <main className="workspace-page bot-page">
      <header className="conversation-header">
        <div>
          <Link className="back-link" href={`/dashboard/organizations/${slug}`}>← Organization workspace</Link>
          <p className="eyebrow">AI BOT CONFIGURATION</p>
          <h1>{organization.name}</h1>
          <p>These instructions control how this organization&apos;s assistant qualifies leads, responds, and escalates conversations.</p>
        </div>
        <span className={`badge ${organization.active ? "ready" : ""}`}>{organization.active ? "Bot enabled" : "Bot paused"}</span>
      </header>

      {saved === "1" ? <p className="reply-notice success bot-notice">Bot configuration saved.</p> : null}

      <section className="section bot-layout">
        <form className="panel bot-form" action={saveBotConfiguration}>
          <div><p className="eyebrow">BEHAVIOR</p><h2>Assistant instructions</h2><p className="field-help">Be specific about services, questions to ask, promises to avoid, and when a human must take over.</p></div>
          <label htmlFor="instructions">Organization-specific instructions</label>
          <textarea id="instructions" name="instructions" defaultValue={instructions} minLength={80} maxLength={8000} required />
          <label className="toggle-row"><input name="active" type="checkbox" defaultChecked={organization.active} /><span><strong>Enable this organization</strong><small>Turning this off pauses automated replies while keeping conversation history.</small></span></label>
          <button type="submit">Save bot configuration</button>
        </form>

        <aside className="panel bot-summary">
          <p className="eyebrow">CHANNEL STATUS</p>
          <h2>SMS identity</h2>
          <div className="queue"><span className="pulse" /><div><strong>Organization</strong><small>{organization.name}</small></div><em>Ready</em></div>
          <div className="queue"><span className="pulse" /><div><strong>Twilio number</strong><small>{organization.sms_number ?? "Not assigned yet"}</small></div><em>{organization.sms_number ? "Ready" : "Pending"}</em></div>
          <div className="guardrails"><strong>Built-in safety rules</strong><p>Consent enforcement, STOP handling, emergency escalation, human takeover, message history, and organization isolation remain active regardless of custom instructions.</p></div>
        </aside>
      </section>
    </main>
  );
}
