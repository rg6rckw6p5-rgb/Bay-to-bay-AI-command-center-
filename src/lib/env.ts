import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC"),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().startsWith("sk-"),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
});

export function getServerEnv() {
  return serverSchema.parse(process.env);
}

export function configurationStatus() {
  const result = serverSchema.safeParse(process.env);
  return {
    configured: result.success,
    missing: result.success
      ? []
      : result.error.issues.map((issue) => String(issue.path[0])).filter(Boolean),
  };
}
