"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import "./login.css";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("The email or password was not recognized.");
        return;
      }

      const requestedPath = searchParams.get("next");
      const destination = requestedPath?.startsWith("/") ? requestedPath : "/dashboard";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please contact an administrator.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <p className="eyebrow">BAY TO BAY HOLDINGS</p>
        <h1>Every lead.<br />Every company.<br /><em>One command center.</em></h1>
        <p>Secure operations for Bay to Bay businesses and Rise and Shine Charities & Ministries.</p>
      </section>
      <section className="login-panel">
        <form onSubmit={handleSubmit}>
          <p className="eyebrow">AUTHORIZED ACCESS</p>
          <h2>Welcome back</h2>
          <p className="login-intro">Sign in with your company account.</p>
          <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
          <Link className="login-help-link" href="/forgot-password">Forgot your password?</Link>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in securely"}</button>
          <small>Customer information is protected and access is audited.</small>
        </form>
      </section>
    </main>
  );
}
