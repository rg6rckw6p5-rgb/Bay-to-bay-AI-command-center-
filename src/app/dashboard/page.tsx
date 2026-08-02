import { redirect } from "next/navigation";
import CommandDashboard from "@/components/command-dashboard";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [organizationsResult, contactsResult, conversationsResult, messagesResult] = await Promise.all([
    supabase.from("organizations").select("id,name,slug,kind").order("name"),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);

  if (organizationsResult.error) {
    throw new Error("Unable to load authorized organizations.");
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
      userEmail={user.email ?? "Owner"}
      signOut={signOut}
    />
  );
}
