import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  emergencyReply,
  generateAssistantReply,
  requiresHumanEscalation,
} from "@/lib/ai-assistant";
import { createSupabaseServer } from "@/lib/supabase/server";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1600),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1600),
  })).max(12).default([]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a message up to 1,600 characters." }, { status: 400 });
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name,ai_instructions,active")
    .eq("slug", slug)
    .maybeSingle();

  if (!organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  if (!organization.active) {
    return NextResponse.json({ error: "Enable this organization before testing its bot." }, { status: 409 });
  }

  const history = [
    ...parsed.data.history,
    { role: "user" as const, content: parsed.data.message },
  ];

  if (requiresHumanEscalation(parsed.data.message)) {
    return NextResponse.json({ reply: emergencyReply, escalated: true });
  }

  try {
    const reply = await generateAssistantReply({
      organizationName: organization.name,
      organizationInstructions: organization.ai_instructions,
      history,
    });
    return NextResponse.json({ reply, escalated: false });
  } catch {
    return NextResponse.json({
      error: "The AI service could not answer. Check the OpenAI account and try again.",
    }, { status: 502 });
  }
}
