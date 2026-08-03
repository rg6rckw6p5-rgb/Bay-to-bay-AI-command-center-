"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
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
      const supabase = createSupabaseBrowser();
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (recoveryError) {
        setError(recoveryError.message.includes("rate limit")
          ? "Too many recovery emails were requested. Please wait one hour and try again."
          : "We could not send the recovery email. Please try again shortly.");
        return;
      }

      setMessage("Check your email for a secure password-reset link.");
    } catch {
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
