import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const requestSchema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Password recovery is missing Supabase configuration.");
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    console.error("Supabase password recovery failed", {
      code: error.code ?? "unknown",
      message: error.message,
      status: error.status,
    });

    const rateLimited = error.message.toLowerCase().includes("rate limit") || error.status === 429;
    return NextResponse.json(
      {
        error: rateLimited
          ? "Too many recovery emails were requested. Please wait before trying again."
          : "Password recovery could not be started.",
        reference: error.code ?? error.status ?? "AUTH",
      },
      { status: rateLimited ? 429 : 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
