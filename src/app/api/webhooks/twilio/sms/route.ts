import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";
import {
  emergencyReply,
  generateAssistantReply,
  requiresHumanEscalation,
} from "@/lib/ai-assistant";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const inboundSchema = z.object({
  MessageSid: z.string().startsWith("SM"),
  From: z.string().min(8),
  To: z.string().min(8),
  Body: z.string().trim().max(1600).default(""),
  NumMedia: z.coerce.number().int().min(0).max(10).default(0),
});

const optOutWords = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const startWords = new Set(["start", "unstop", "yes"]);
type ConversationMessage = {
  direction: "inbound" | "outbound";
  body: string;
};

function xml(message?: string) {
  const response = new twilio.twiml.MessagingResponse();
  if (message) response.message(message);
  return new NextResponse(response.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = new URL(request.url);
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  if (!twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url.toString(), params)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const parsed = inboundSchema.safeParse(params);
  if (!parsed.success) return new NextResponse("Invalid payload", { status: 400 });

  const inbound = parsed.data;
  const normalizedBody = inbound.Body.toLowerCase().trim();
  const supabase = createSupabaseAdmin();

  if (optOutWords.has(normalizedBody) || startWords.has(normalizedBody)) {
    await supabase.from("sms_consents").upsert({
      phone: inbound.From,
      status: optOutWords.has(normalizedBody) ? "opted_out" : "opted_in",
      source: "keyword",
      updated_at: new Date().toISOString(),
    }, { onConflict: "phone" });
    return xml();
  }

  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("provider_message_id", inbound.MessageSid)
    .maybeSingle();
  if (existing) return xml();

  const { data: organization } = await supabase
    .from("organizations")
    .select("id,name,kind,ai_instructions")
    .eq("sms_number", inbound.To)
    .eq("active", true)
    .maybeSingle();
  if (!organization) return xml();

  const { data: consent } = await supabase
    .from("sms_consents")
    .select("status")
    .eq("phone", inbound.From)
    .maybeSingle();
  if (consent?.status === "opted_out") return xml();

  const { data: contact } = await supabase
    .from("contacts")
    .upsert({ organization_id: organization.id, phone: inbound.From }, {
      onConflict: "organization_id,phone",
    })
    .select("id")
    .single();
  if (!contact) return xml();

  const { data: conversation } = await supabase
    .from("conversations")
    .upsert(
      { organization_id: organization.id, contact_id: contact.id, channel: "sms" },
      { onConflict: "organization_id,contact_id,channel" },
    )
    .select("id,mode")
    .single();
  if (!conversation) return xml();

  await supabase.from("messages").insert({
    organization_id: organization.id,
    conversation_id: conversation.id,
    direction: "inbound",
    body: inbound.Body,
    provider_message_id: inbound.MessageSid,
    status: "received",
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  if (conversation.mode !== "ai") return xml();

  if (requiresHumanEscalation(inbound.Body)) {
    await Promise.all([
      supabase.from("conversations").update({
        mode: "human",
        last_message_at: new Date().toISOString(),
      }).eq("id", conversation.id),
      supabase.from("audit_logs").insert({
        organization_id: organization.id,
        action: "urgent_sms_escalated",
        entity_type: "conversation",
        entity_id: conversation.id,
        metadata: { message_sid: inbound.MessageSid },
      }),
    ]);

    await supabase.from("messages").insert({
      organization_id: organization.id,
      conversation_id: conversation.id,
      direction: "outbound",
      body: emergencyReply,
      status: "queued",
      ai_generated: false,
    });
    return xml(emergencyReply);
  }

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("direction,body")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const conversationHistory = ((recentMessages ?? []) as ConversationMessage[])
    .reverse()
    .map((message) => ({
      role: message.direction === "inbound" ? "user" as const : "assistant" as const,
      content: message.body,
    }));

  let reply;
  try {
    reply = await generateAssistantReply({
      organizationName: organization.name,
      organizationInstructions: organization.ai_instructions,
      history: conversationHistory,
    });
  } catch {
    const fallbackReply = "Thanks for your message. A team member will follow up as soon as possible.";
    await Promise.all([
      supabase.from("conversations").update({ mode: "human" }).eq("id", conversation.id),
      supabase.from("audit_logs").insert({
        organization_id: organization.id,
        action: "ai_reply_failed",
        entity_type: "conversation",
        entity_id: conversation.id,
        metadata: { message_sid: inbound.MessageSid },
      }),
      supabase.from("messages").insert({
        organization_id: organization.id,
        conversation_id: conversation.id,
        direction: "outbound",
        body: fallbackReply,
        status: "queued",
        ai_generated: false,
      }),
    ]);
    return xml(fallbackReply);
  }

  await supabase.from("messages").insert({
    organization_id: organization.id,
    conversation_id: conversation.id,
    direction: "outbound",
    body: reply,
    status: "queued",
    ai_generated: true,
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  return xml(reply);
}
