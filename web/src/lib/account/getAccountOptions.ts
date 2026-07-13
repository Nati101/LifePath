import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountOptions } from "@/lib/account/options";

export async function getAccountOptions(
  supabase: SupabaseClient,
): Promise<AccountOptions> {
  const [{ data: schools, error: schoolsError }, { data: advisors, error: advisorsError }] =
    await Promise.all([
      supabase.from("schools").select("id, name").order("name"),
      supabase.rpc("list_advisors"),
    ]);

  if (schoolsError) {
    console.error("Failed to load schools:", schoolsError.message);
  }

  if (advisorsError) {
    console.error("Failed to load advisors:", advisorsError.message);
  }

  return {
    schools: (schools ?? []).map((row) => ({ id: row.id, name: row.name })),
    advisors: (advisors ?? []).map((row: { id: string; full_name: string }) => ({
      id: row.id,
      name: row.full_name,
    })),
  };
}
