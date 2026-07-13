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

  const [{ data: schools, error: schoolsError }, { data: advisors, error: advisorsError }] =
    await Promise.all([
      // Filter schools by advisor's school if student has an advisor with a school
      userAdvisorSchoolId
        ? supabase
            .from("schools")
            .select("id, name")
            .eq("id", userAdvisorSchoolId)
            .order("name")
        : supabase.from("schools").select("id, name").order("name"),
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
    advisors: (advisors ?? []).map((row: { id: string; full_name: string; school_id: string | null }) => ({
      id: row.id,
      name: row.full_name,
      schoolId: row.school_id,
    })),
  };
}
