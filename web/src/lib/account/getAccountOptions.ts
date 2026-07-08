import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountOptions } from "@/lib/account/options";

export async function getAccountOptions(
  supabase: SupabaseClient,
  userId?: string,
): Promise<AccountOptions> {
  // Get current user's profile to check for advisor and their school
  let userAdvisorSchoolId: string | null = null;
  
  if (userId) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("advisor_id, role")
      .eq("id", userId)
      .single();

    // If user is a student with an advisor, get the advisor's school
    if (userProfile?.role === "student" && userProfile?.advisor_id) {
      const { data: advisorProfile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", userProfile.advisor_id)
        .single();
      
      userAdvisorSchoolId = advisorProfile?.school_id ?? null;
    }
  }

  const [{ data: classes, error: classesError }, { data: advisors, error: advisorsError }] =
    await Promise.all([
      // Filter classes by advisor's school if student has an advisor with a school
      userAdvisorSchoolId
        ? supabase
            .from("classes")
            .select("id, name")
            .eq("school_id", userAdvisorSchoolId)
            .order("name")
        : supabase.from("classes").select("id, name").order("name"),
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
    advisors: (advisors ?? []).map((row: { id: string; full_name: string; school_id: string | null }) => ({
      id: row.id,
      name: row.full_name,
      schoolId: row.school_id,
    })),
  };
}
