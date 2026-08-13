import type { Metadata } from "next";
import Link from "next/link";
import "../legal.css";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | Bay to Bay Tree Services of Florida",
  description: "SMS messaging terms for Bay to Bay Tree Services of Florida.",
};

export default function SmsTermsPage() {
  return (
    <div className="legal-page">
      <article className="legal-shell">
        <a className="legal-brand" href="https://baytobaytreeservice.com">
          Bay to Bay Tree Services of Florida
        </a>
        <p className="eyebrow">MOBILE MESSAGING</p>
        <h1>SMS Terms &amp; Conditions</h1>
        <p className="legal-updated">Effective August 12, 2026</p>

        <section className="legal-section">
          <h2>Program description</h2>
          <p>
            Bay to Bay Tree Services of Florida uses text messaging to communicate with customers who
            request or consent to messages. Messages may include responses to inquiries, estimate and
            appointment scheduling, appointment reminders, requests for property information or photos,
            service updates, and customer-support follow-ups.
          </p>
        </section>

        <section className="legal-section">
          <h2>Consent and eligibility</h2>
          <p>
            You may opt in by directly texting us or by verbally asking for and agreeing to text
            communication during a phone call or in-person conversation. By opting in, you authorize us
            to send messages at the number you provide. Consent is not a condition of purchase.
          </p>
        </section>

        <section className="legal-section">
          <h2>Message frequency and charges</h2>
          <p>
            Message frequency varies based on your requests, appointments, and service activity.
            Message and data rates may apply. Your wireless carrier is not liable for delayed or
            undelivered messages.
          </p>
        </section>

        <section className="legal-section">
          <h2>Opt out and help</h2>
          <p>
            Reply STOP to any message to opt out. After you opt out, you may receive one final message
            confirming your request. Reply HELP for assistance. You may opt back in by sending START.
          </p>
        </section>

        <section className="legal-section">
          <h2>Privacy</h2>
          <p>
            We do not sell, rent, or share mobile information with third parties or affiliates for
            marketing or promotional purposes. See our <Link href="/privacy">Privacy Policy</Link> for
            details about how we collect, use, and protect information.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes and contact</h2>
          <p>
            We may update these terms from time to time by posting a revised version here. For questions
            or assistance, contact Bay to Bay Tree Services of Florida through our website at{" "}
            <a href="https://baytobaytreeservice.com">baytobaytreeservice.com</a>.
          </p>
        </section>

        <nav className="legal-links" aria-label="Legal pages">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/login">Command Center sign in</Link>
        </nav>
      </article>
    </div>
  );
}
