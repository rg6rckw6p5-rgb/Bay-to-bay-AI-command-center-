import { Suspense } from "react";
import LoginForm from "./login-form";
import "./login.css";

function LoginLoading() {
  return (
    <main className="login-page">
      <section className="login-brand">
        <p className="eyebrow">BAY TO BAY HOLDINGS</p>
        <h1>Every lead.<br />Every company.<br /><em>One command center.</em></h1>
      </section>
      <section className="login-panel"><p>Preparing secure sign-in…</p></section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
