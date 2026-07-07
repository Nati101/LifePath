import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdminUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin";
}
