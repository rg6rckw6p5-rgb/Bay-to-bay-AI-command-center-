const organizations = [
  ["Tree Services", "🌳", "12 active leads", "4 estimates today"],
  ["Premier Painting", "🎨", "8 active leads", "2 estimates today"],
  ["Docks & Decks", "⚓", "6 active leads", "3 site visits"],
  ["Landscaping", "🌿", "9 active leads", "5 follow-ups"],
  ["ArborPro", "🌲", "4 consultations", "2 reports due"],
  ["Rise & Shine", "❤️", "7 open intakes", "3 volunteers needed"],
];

export default function CommandDashboard() {
  return (
    <main>
      <header className="topbar">
        <div>
          <span className="eyebrow">BAY TO BAY HOLDINGS</span>
          <h1>AI Command Center</h1>
        </div>
        <div className="status"><span /> Systems ready</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">MONDAY MORNING BRIEFING</p>
          <h2>Good morning. Here’s what needs your attention.</h2>
          <p>One workspace for customer conversations, estimates, scheduling, field work, and community outreach.</p>
        </div>
        <button>Open unified inbox <span>→</span></button>
      </section>

      <section className="metrics" aria-label="Business overview">
        {[
          ["46", "Open leads", "+8 this week"],
          ["11", "Estimates due", "4 high priority"],
          ["18", "Jobs scheduled", "Next 7 days"],
          ["92%", "Response rate", "Under 60 seconds"],
        ].map(([value, label, note]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{note}</small>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">WORKSPACES</p><h2>Your organizations</h2></div>
          <button className="quiet">View reports</button>
        </div>
        <div className="org-grid">
          {organizations.map(([name, icon, activity, task]) => (
            <article className="org-card" key={name}>
              <div className="org-icon">{icon}</div>
              <div><h3>{name}</h3><p>{activity}</p><small>{task}</small></div>
              <span className="arrow">→</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section split">
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">AI OPERATIONS</p><h2>Priority queue</h2></div><span className="badge">4 urgent</span></div>
          {[
            ["Storm-damaged oak over roof", "Tree Services · 2 min ago", "Emergency"],
            ["Estimate follow-up overdue", "Premier Painting · 1 day ago", "Sales"],
            ["Housing assistance request", "Rise & Shine · 18 min ago", "Human review"],
          ].map(([title, meta, tag]) => (
            <div className="queue" key={title}><span className="pulse" /><div><strong>{title}</strong><small>{meta}</small></div><em>{tag}</em></div>
          ))}
        </article>
        <article className="panel assistant">
          <p className="eyebrow">COMMAND AI</p>
          <h2>Your operations assistant</h2>
          <p>Ask what needs follow-up, where the schedule has openings, or which leads are ready to close.</p>
          <div className="prompt">What should I focus on today?<button aria-label="Send">↑</button></div>
          <small>AI suggestions require human review before customer-facing actions.</small>
        </article>
      </section>
    </main>
  );
}
