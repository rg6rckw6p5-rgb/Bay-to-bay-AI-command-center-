import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganizationWorkspace({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: organization } = await supabase
    .from("organizations")
    .select("id,name,slug,kind,sms_number,active")
    .eq("slug", slug)
    .maybeSingle();
  if (!organization) notFound();

  const [contacts, conversations, messages, recent] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
    supabase.from("conversations").select("id,mode,last_message_at,contacts(first_name,last_name,phone)").eq("organization_id", organization.id).order("last_message_at", { ascending: false }).limit(6),
  ]);

  const metrics = [
    [contacts.count ?? 0, "Customers"],
    [conversations.count ?? 0, "Conversations"],
    [messages.count ?? 0, "Messages"],
    [organization.sms_number ? "Connected" : "Pending", "SMS number"],
  ];

  return (
    <main className="workspace-page">
      <header className="conversation-header">
        <div>
          <Link className="back-link" href="/dashboard">← All organizations</Link>
          <p className="eyebrow">ORGANIZATION WORKSPACE</p>
          <h1>{organization.name}</h1>
          <p>{organization.kind === "nonprofit" ? "Community outreach and participant communications" : "Customers, leads, and AI-assisted service conversations"}</p>
        </div>
        <span className={`badge ${organization.active ? "ready" : ""}`}>{organization.active ? "Active" : "Paused"}</span>
      </header>

      <section className="metrics workspace-metrics" aria-label={`${organization.name} overview`}>
        {metrics.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <section className="section split">
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest conversations</h2></div></div>
          {(recent.data ?? []).length ? (recent.data ?? []).map((conversation) => {
            const contactValue = Array.isArray(conversation.contacts) ? conversation.contacts[0] : conversation.contacts;
            const contact = contactValue as { first_name?: string | null; last_name?: string | null; phone?: string | null } | null;
            const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || contact?.phone || "Unknown customer";
            return <Link className="workspace-conversation" href={`/dashboard/conversations/${conversation.id}`} key={conversation.id}><div><strong>{name}</strong><small>{new Date(conversation.last_message_at).toLocaleString()}</small></div><span className={`mode-badge ${conversation.mode}`}>{conversation.mode}</span></Link>;
          }) : <div className="empty-inbox compact"><h3>No conversations yet</h3><p>Incoming texts for this organization will appear here.</p></div>}
        </article>
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">BOT READINESS</p><h2>Communication channel</h2></div></div>
          <div className="queue"><span className="pulse" /><div><strong>Organization identity</strong><small>Separate workspace and AI context</small></div><em>Ready</em></div>
          <div className="queue"><span className="pulse" /><div><strong>SMS routing</strong><small>{organization.sms_number ?? "Waiting for an approved Twilio number"}</small></div><em>{organization.sms_number ? "Ready" : "Pending"}</em></div>
          <div className="queue"><span className="pulse" /><div><strong>Human takeover</strong><small>Owner can pause AI and reply directly</small></div><em>Ready</em></div>
        </article>
      </section>
    </main>
  );
}
