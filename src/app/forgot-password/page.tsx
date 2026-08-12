"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import "../login/login.css";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    try {
      const response = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { error?: string; reference?: string };

      if (!response.ok) {
        setError(`${result.error ?? "Password recovery is temporarily unavailable."} Reference: ${result.reference ?? response.status}.`);
        return;
      }

      setMessage("Check your email for a secure password-reset link.");
    } catch (recoveryException) {
      console.error("Password recovery request failed", recoveryException);
      setError("Password recovery is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <p className="eyebrow">BAY TO BAY HOLDINGS</p>
        <h1>Secure access.<br /><em>Simple recovery.</em></h1>
        <p>Reset your Command Center password without contacting support or sharing credentials.</p>
      </section>
      <section className="login-panel">
        <form onSubmit={handleSubmit}>
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h2>Reset your password</h2>
          <p className="login-intro">Enter the email connected to your owner account.</p>
          <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          {message ? <p className="login-success" role="status">{message}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "Sending…" : "Send recovery email"}</button>
          <small><Link href="/login">Return to sign in</Link></small>
        </form>
      </section>
    </main>
  );
}
