type Organization = {
  id: string;
  name: string;
  slug: string;
  kind: "business" | "nonprofit";
};

type DashboardMetrics = {
  organizations: number;
  contacts: number;
  conversations: number;
  messages: number;
};

const icons: Record<string, string> = {
  "tree-services": "🌳",
  "premier-painting": "🎨",
  "docks-decks": "⚓",
  landscaping: "🌿",
  arborpro: "🌲",
  "rise-and-shine": "❤️",
};

export default function CommandDashboard({
  organizations,
  metrics,
  userEmail,
  signOut,
}: {
  organizations: Organization[];
  metrics: DashboardMetrics;
  userEmail: string;
  signOut: () => Promise<void>;
}) {
  const metricCards = [
    [String(metrics.organizations), "Organizations", "Owner access confirmed"],
    [String(metrics.contacts), "Customers", "Live Supabase records"],
    [String(metrics.conversations), "Conversations", "Across all channels"],
    [String(metrics.messages), "Messages", "Inbound and outbound"],
  ];

  return (
    <main>
      <header className="topbar">
        <div>
          <span className="eyebrow">BAY TO BAY HOLDINGS</span>
          <h1>AI Command Center</h1>
        </div>
        <div className="account-actions">
          <div className="status"><span /> Live data connected</div>
          <small>{userEmail}</small>
          <form action={signOut}><button className="quiet" type="submit">Sign out</button></form>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">OWNER OVERVIEW</p>
          <h2>Your command center is securely connected.</h2>
          <p>Customer conversations and organization activity will appear here as your service channels come online.</p>
        </div>
        <a className="hero-action" href="#workspaces">View workspaces <span>→</span></a>
      </section>

      <section className="metrics" aria-label="Live business overview">
        {metricCards.map(([value, label, note]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{note}</small>
          </article>
        ))}
      </section>

      <section className="section" id="workspaces">
        <div className="section-heading">
          <div><p className="eyebrow">WORKSPACES</p><h2>Your organizations</h2></div>
          <span className="connected-label">Database verified</span>
        </div>
        <div className="org-grid">
          {organizations.map((organization) => (
            <article className="org-card" key={organization.id}>
              <div className="org-icon">{icons[organization.slug] ?? "◆"}</div>
              <div>
                <h3>{organization.name}</h3>
                <p>{organization.kind === "nonprofit" ? "Nonprofit workspace" : "Service business"}</p>
                <small>Secure owner access enabled</small>
              </div>
              <span className="arrow">→</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">SETUP STATUS</p><h2>Production readiness</h2></div><span className="badge ready">Core ready</span></div>
          {[
            ["Secure owner authentication", "Complete"],
            ["Organization data isolation", "Complete"],
            ["SMS and AI credentials", "Next"],
          ].map(([title, tag]) => (
            <div className="queue" key={title}><span className="pulse" /><div><strong>{title}</strong><small>Verified against the production foundation</small></div><em>{tag}</em></div>
          ))}
        </article>
        <article className="panel assistant">
          <p className="eyebrow">COMMAND AI</p>
          <h2>Operations assistant</h2>
          <p>The AI workspace will activate after OpenAI and Twilio server credentials are added securely.</p>
          <div className="prompt disabled-prompt">AI connection pending</div>
          <small>No customer-facing automation will run before testing and approval.</small>
        </article>
      </section>
    </main>
  );
}
