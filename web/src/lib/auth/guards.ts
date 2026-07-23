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

/** Home path after sign-in: admins → dashboard, students → landing. */
export async function getPostAuthHomePath(supabase: SupabaseClient): Promise<string> {
  const user = await getAuthenticatedUser(supabase);
  if (!user) return "/login";
  return (await isAdminUser(supabase, user.id)) ? "/admin" : "/";
}

export async function isSuperAdminUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .single();

  return Boolean(profile?.is_super_admin);
}
