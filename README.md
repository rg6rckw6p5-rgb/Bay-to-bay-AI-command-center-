# Bay to Bay AI Command Center

Production-oriented multi-organization foundation for Bay to Bay’s five service businesses and Rise and Shine Charities & Ministries.

## Included now

- Mobile-first owner dashboard
- Six isolated organization records
- Supabase schema with row-level security
- Twilio inbound SMS signature verification
- Automatic organization routing by receiving number
- Contact and conversation upserts
- Idempotent inbound message handling
- STOP/START consent persistence
- AI/human/paused conversation modes
- OpenAI Responses API integration
- Safe health/configuration endpoint
- Vercel-compatible Next.js application

## Local setup

1. Install Node.js 22.
2. Copy `.env.example` to `.env.local` and fill in your own credentials.
3. Run `npm install`.
4. Apply `supabase/migrations/001_initial.sql` in Supabase.
5. Run `npm run dev`.

Never commit `.env.local`, API keys, Twilio auth tokens, or the Supabase service-role key.

## Twilio webhook

After deployment, configure the phone number’s incoming message webhook as:

`https://YOUR_DOMAIN/api/webhooks/twilio/sms`

Use HTTP `POST`. Twilio request signatures are checked before processing.

## Deployment

Import the GitHub repository into Vercel, configure the environment variables from `.env.example`, and deploy. Visit `/api/health` to confirm that every required environment variable exists; it reports variable names only and never secret values.

## Current boundary

This is the tested production foundation, not the completed business operating system. Authentication screens, live inbox UI, lead pipeline, scheduling, estimates, billing, nonprofit workflows, reporting, and full automated tests remain to be implemented.
