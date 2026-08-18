"use client";

import { FormEvent, useState } from "react";
import type { AssistantHistoryMessage } from "@/lib/ai-assistant";

type TranscriptMessage = AssistantHistoryMessage & { escalated?: boolean };

export function BotTestConsole({ slug, active }: { slug: string; active: boolean }) {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending || !active) return;

    setError("");
    setSending(true);
    setTranscript((current) => [...current, { role: "user", content: trimmed }]);
    setMessage("");

    try {
      const response = await fetch(`/api/organizations/${encodeURIComponent(slug)}/bot/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: transcript.slice(-12) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The test could not be completed.");

      setTranscript((current) => [...current, {
        role: "assistant",
        content: result.reply,
        escalated: result.escalated,
      }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The test could not be completed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="panel bot-test-panel">
      <div className="bot-test-heading">
        <div>
          <p className="eyebrow">PRIVATE TEST CONSOLE</p>
          <h2>Test this assistant</h2>
          <p className="field-help">Uses the live AI and saved instructions. No SMS is sent and no customer record is created.</p>
        </div>
        {transcript.length ? (
          <button className="secondary-button" type="button" onClick={() => { setTranscript([]); setError(""); }}>Reset test</button>
        ) : null}
      </div>

      <div className="bot-test-transcript" aria-live="polite">
        {transcript.length === 0 ? (
          <div className="bot-test-empty">
            <strong>Try a realistic customer message</strong>
            <span>Example: “I need an estimate to remove a tree near my house.”</span>
          </div>
        ) : transcript.map((item, index) => (
          <div className={`bot-test-message ${item.role}`} key={`${item.role}-${index}`}>
            <small>{item.role === "user" ? "Test customer" : item.escalated ? "Assistant · human escalation" : "Assistant"}</small>
            <p>{item.content}</p>
          </div>
        ))}
        {sending ? <div className="bot-test-message assistant"><small>Assistant</small><p>Thinking…</p></div> : null}
      </div>

      {error ? <p className="reply-notice error">{error}</p> : null}
      {!active ? <p className="reply-notice error">This bot is paused. Enable and save it before testing.</p> : null}

      <form className="bot-test-form" onSubmit={submit}>
        <label htmlFor="bot-test-message">Test customer message</label>
        <textarea
          id="bot-test-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type what a customer might text…"
          maxLength={1600}
          disabled={!active || sending}
          required
        />
        <button type="submit" disabled={!active || sending || !message.trim()}>{sending ? "Testing…" : "Send private test"}</button>
      </form>
    </section>
  );
}
