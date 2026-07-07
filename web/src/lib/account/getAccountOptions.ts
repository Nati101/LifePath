import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountOptions } from "@/lib/account/options";

export async function getAccountOptions(
  supabase: SupabaseClient,
): Promise<AccountOptions> {
  const [{ data: classes, error: classesError }, { data: advisors, error: advisorsError }] =
    await Promise.all([
      supabase.from("classes").select("id, name").order("name"),
      supabase.rpc("list_advisors"),
    ]);

  if (classesError) {
    console.error("Failed to load classes:", classesError.message);
  }

  if (advisorsError) {
    console.error("Failed to load advisors:", advisorsError.message);
  }

  return {
    classes: (classes ?? []).map((row) => ({ id: row.id, name: row.name })),
    advisors: (advisors ?? []).map((row: { id: string; full_name: string }) => ({
      id: row.id,
      name: row.full_name,
    })),
  };
}
