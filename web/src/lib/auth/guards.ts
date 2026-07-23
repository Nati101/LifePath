import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  // Fallback right after sign-in if getUser has not settled yet.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

type ProfileAccess = {
  role: string | null;
  is_super_admin: boolean | null;
};

async function getProfileAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileAccess | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile access lookup failed:", error.message);
    return null;
  }

  return data;
}

export function profileHasAdminAccess(profile: ProfileAccess | null | undefined): boolean {
  return profile?.role === "admin" || Boolean(profile?.is_super_admin);
}

export async function isAdminUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  return profileHasAdminAccess(await getProfileAccess(supabase, userId));
}

export async function isSuperAdminUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const profile = await getProfileAccess(supabase, userId);
  return Boolean(profile?.is_super_admin);
}

/** Home path after sign-in: admins/super-admins → dashboard, students → landing. */
export async function getPostAuthHomePath(supabase: SupabaseClient): Promise<string> {
  const user = await getAuthenticatedUser(supabase);
  if (!user) return "/login";
  return (await isAdminUser(supabase, user.id)) ? "/admin" : "/";
}
