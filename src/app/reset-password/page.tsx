"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import "../login/login.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError("This recovery link is invalid or has expired. Request a new one from the sign-in page.");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (password.length < 10) {
      setError("Use at least 10 characters for your new password.");
      setLoading(false);
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Your password could not be updated. Request a new recovery link and try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
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
        <h1>Choose a new<br /><em>secure password.</em></h1>
        <p>Your password is updated directly with Supabase and is never visible to Bay to Bay staff.</p>
      </section>
      <section className="login-panel">
        <form onSubmit={handleSubmit}>
          <p className="eyebrow">SECURE RECOVERY</p>
          <h2>Create new password</h2>
          <p className="login-intro">Use at least 10 characters and keep it private.</p>
          <label>New password<input name="password" type="password" autoComplete="new-password" required minLength={10} disabled={!ready} /></label>
          <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" required minLength={10} disabled={!ready} /></label>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={!ready || loading}>{loading ? "Updating…" : "Update password"}</button>
          <small>Recovery links expire and can only be used once.</small>
        </form>
      </section>
    </main>
  );
}
