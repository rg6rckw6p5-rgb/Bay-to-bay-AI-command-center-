import { redirect } from "next/navigation";
import CommandDashboard from "@/components/command-dashboard";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <CommandDashboard />;
}
