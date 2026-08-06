import { redirect } from "next/navigation";
import CommandDashboard from "@/components/command-dashboard";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [organizationsResult, contactsResult, conversationsResult, messagesResult, recentConversationsResult] = await Promise.all([
    supabase.from("organizations").select("id,name,slug,kind").order("name"),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase
      .from("conversations")
      .select("id,organization_id,contact_id,mode,last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(8),
  ]);

  if (organizationsResult.error) {
    throw new Error("Unable to load authorized organizations.");
  }

  const recentConversations = recentConversationsResult.data ?? [];
  const conversationIds = recentConversations.map((conversation) => conversation.id);
  const contactIds = recentConversations.map((conversation) => conversation.contact_id);
  const [recentMessagesResult, conversationContactsResult] = await Promise.all([
    conversationIds.length
      ? supabase
          .from("messages")
          .select("conversation_id,body,direction,created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    contactIds.length
      ? supabase
          .from("contacts")
          .select("id,first_name,last_name,phone")
          .in("id", contactIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const contactsById = new Map((conversationContactsResult.data ?? []).map((contact) => [contact.id, contact]));
  const organizationsById = new Map((organizationsResult.data ?? []).map((organization) => [organization.id, organization]));
  const latestMessageByConversation = new Map<string, { body: string; direction: "inbound" | "outbound"; created_at: string }>();
  for (const message of recentMessagesResult.data ?? []) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }
  }

  async function signOut() {
    "use server";
    const serverSupabase = await createSupabaseServer();
    await serverSupabase.auth.signOut();
    redirect("/login");
  }

  return (
    <CommandDashboard
      organizations={organizationsResult.data ?? []}
      metrics={{
        organizations: organizationsResult.data?.length ?? 0,
        contacts: contactsResult.count ?? 0,
        conversations: conversationsResult.count ?? 0,
        messages: messagesResult.count ?? 0,
      }}
      recentConversations={recentConversations.map((conversation) => {
        const contact = contactsById.get(conversation.contact_id);
        const organization = organizationsById.get(conversation.organization_id);
        const latestMessage = latestMessageByConversation.get(conversation.id);
        const contactName = [contact?.first_name, contact?.last_name].filter(Boolean).join(" ");

        return {
          id: conversation.id,
          organizationName: organization?.name ?? "Organization",
          contactName: contactName || contact?.phone || "Unknown customer",
          mode: conversation.mode,
          lastMessageAt: latestMessage?.created_at ?? conversation.last_message_at,
          latestMessage: latestMessage?.body ?? "Conversation started",
          direction: latestMessage?.direction ?? "inbound",
        };
      })}
      userEmail={user.email ?? "Owner"}
      signOut={signOut}
    />
  );
}
