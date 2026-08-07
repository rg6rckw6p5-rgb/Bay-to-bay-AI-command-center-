import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const statusSchema = z.object({
  MessageSid: z.string().startsWith("SM"),
  MessageStatus: z.enum(["accepted", "scheduled", "queued", "sending", "sent", "delivered", "undelivered", "failed", "read", "canceled"]),
  ErrorCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  if (!twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, request.url, params)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const parsed = statusSchema.safeParse(params);
  if (!parsed.success) return new NextResponse("Invalid payload", { status: 400 });

  const supabase = createSupabaseAdmin();
  await supabase
    .from("messages")
    .update({ status: parsed.data.MessageStatus })
    .eq("provider_message_id", parsed.data.MessageSid);

  if (parsed.data.MessageStatus === "failed" || parsed.data.MessageStatus === "undelivered") {
    const { data: message } = await supabase
      .from("messages")
      .select("organization_id,conversation_id")
      .eq("provider_message_id", parsed.data.MessageSid)
      .maybeSingle();

    if (message) {
      await supabase.from("audit_logs").insert({
        organization_id: message.organization_id,
        action: "sms_delivery_failed",
        entity_type: "conversation",
        entity_id: message.conversation_id,
        metadata: {
          message_sid: parsed.data.MessageSid,
          status: parsed.data.MessageStatus,
          error_code: parsed.data.ErrorCode ?? null,
        },
      });
    }
  }

  return new NextResponse(null, { status: 204 });
}
