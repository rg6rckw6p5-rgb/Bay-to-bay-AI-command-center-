import type { Metadata } from "next";
import Link from "next/link";
import "../legal.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Bay to Bay Tree Services of Florida",
  description: "Privacy and mobile messaging policy for Bay to Bay Tree Services of Florida.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <article className="legal-shell">
        <a className="legal-brand" href="https://baytobaytreeservice.com">
          Bay to Bay Tree Services of Florida
        </a>
        <p className="eyebrow">LEGAL</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Effective August 12, 2026</p>

        <section className="legal-section">
          <h2>Information we collect</h2>
          <p>
            We may collect information you provide when requesting service or communicating with us,
            including your name, phone number, email address, service address, requested service,
            appointment preferences, messages, and photos you choose to send.
          </p>
        </section>

        <section className="legal-section">
          <h2>How we use information</h2>
          <p>
            We use this information to respond to inquiries, prepare and schedule estimates, provide
            appointment reminders and service updates, perform requested services, maintain business
            records, improve customer support, and comply with legal obligations.
          </p>
        </section>

        <section className="legal-section">
          <h2>Mobile information and SMS consent</h2>
          <p>
            Mobile information, including phone numbers and SMS consent records, will not be sold,
            rented, or shared with third parties or affiliates for their marketing or promotional
            purposes. We may share information with service providers only as needed to operate our
            communications and deliver requested services. Those providers may not use it for their
            own marketing.
          </p>
          <p>
            Message frequency varies based on your requests and service activity. Message and data
            rates may apply. Consent to receive text messages is not a condition of purchase. Reply
            STOP to opt out or HELP for assistance.
          </p>
        </section>

        <section className="legal-section">
          <h2>Data protection and retention</h2>
          <p>
            We use reasonable administrative and technical safeguards to protect personal information.
            We retain information only as long as reasonably necessary for the purposes described here,
            including customer service, recordkeeping, security, and legal compliance.
          </p>
        </section>

        <section className="legal-section">
          <h2>Your choices</h2>
          <p>
            You may opt out of text messages at any time by replying STOP. You may also contact us to
            request access to, correction of, or deletion of personal information, subject to applicable
            recordkeeping requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact us</h2>
          <p>
            For privacy questions or requests, contact Bay to Bay Tree Services of Florida through our
            website at <a href="https://baytobaytreeservice.com">baytobaytreeservice.com</a>.
          </p>
        </section>

        <nav className="legal-links" aria-label="Legal pages">
          <Link href="/sms-terms">SMS Terms &amp; Conditions</Link>
          <Link href="/login">Command Center sign in</Link>
        </nav>
      </article>
    </div>
  );
}
