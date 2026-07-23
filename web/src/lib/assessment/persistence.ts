import type { SupabaseClient } from "@supabase/supabase-js";
import { computeResults } from "@/lib/scoring";
import type { AssessmentResult, PathScore, Responses, SectionKey } from "@/lib/types";

export interface StoredAssessmentResult {
  id: string;
  session_id?: string | null;
  user_id: string;
  path_scores: PathScore[];
  top_paths: PathScore[];
  construct_scores?: Record<string, number> | null;
  section_scores?: unknown;
  computed_at?: string;
  completed_at?: string;
  archived_at?: string;
  source: "current" | "history";
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string) ?? "",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (error) {
    if (error.code === "23505") return;
    console.error("ensureProfile failed:", error.message);
    throw new Error(`Could not create profile: ${error.message}`);
  }
}

export async function getOrCreateSession(
  supabase: SupabaseClient,
  userId: string,
  section?: SectionKey,
) {
  const { data: existing, error: fetchError } = await supabase
    .from("assessment_sessions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("getOrCreateSession fetch failed:", fetchError.message);
    throw new Error(fetchError.message);
  }

  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("assessment_sessions")
    .insert({
      user_id: userId,
      current_section: section ?? "clinical_care",
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced, error: refetchError } = await supabase
        .from("assessment_sessions")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (raced) return raced;
      if (refetchError) throw new Error(refetchError.message);
    }
    console.error("getOrCreateSession insert failed:", insertError.message);
    throw new Error(insertError.message);
  }

  return created;
}

export async function loadResponses(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<Responses> {
  const { data, error } = await supabase
    .from("responses")
    .select("item_id, rating")
    .eq("session_id", sessionId);

  if (error) {
    console.error("loadResponses failed:", error.message);
    throw new Error(error.message);
  }

  const map: Responses = {};
  for (const row of data ?? []) {
    map[row.item_id] = row.rating;
  }
  return map;
}

export async function saveResponse(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    userId: string;
    itemId: string;
    section: SectionKey;
    rating: number;
  },
) {
  const { error } = await supabase.from("responses").upsert(
    {
      session_id: params.sessionId,
      user_id: params.userId,
      item_id: params.itemId,
      section: params.section,
      rating: params.rating,
    },
    { onConflict: "session_id,item_id" },
  );

  if (error) {
    console.error("saveResponse failed:", error.message, params);
    throw new Error(error.message);
  }
}

export async function saveResults(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    userId: string;
    responses: Responses;
  },
) {
  const result = computeResults(params.responses);

  const { error: sessionError } = await supabase
    .from("assessment_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", params.sessionId);

  if (sessionError) {
    console.error("saveResults session update failed:", sessionError.message);
    throw new Error(sessionError.message);
  }

  const { error: resultsError } = await supabase.from("results").upsert(
    {
      session_id: params.sessionId,
      user_id: params.userId,
      path_scores: result.pathScores,
      top_paths: result.topPaths,
      construct_scores: result.constructScores,
      section_scores: result.pathScores,
    },
    { onConflict: "session_id" },
  );

  if (resultsError) {
    console.error("saveResults upsert failed:", resultsError.message);
    throw new Error(resultsError.message);
  }

  return result;
}

export async function getCurrentResult(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredAssessmentResult | null> {
  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getCurrentResult failed:", error.message);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    ...data,
    source: "current",
  };
}

export async function listResultHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredAssessmentResult[]> {
  const { data, error } = await supabase
    .from("assessment_result_history")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("listResultHistory failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    source: "history" as const,
  }));
}

export async function listAllAttempts(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredAssessmentResult[]> {
  const [current, history] = await Promise.all([
    getCurrentResult(supabase, userId),
    listResultHistory(supabase, userId),
  ]);

  return [...(current ? [current] : []), ...history];
}

export function toAssessmentResult(stored: StoredAssessmentResult): AssessmentResult {
  return {
    pathScores: stored.path_scores,
    topPaths: stored.top_paths,
    constructScores: stored.construct_scores ?? {},
    sectionCompletion: {
      clinical_care: 1,
      protection: 1,
      learning_support: 1,
      build_fix: 1,
      stem_systems: 1,
      business_leadership: 1,
      creative: 1,
      experience_service: 1,
      outdoor_systems: 1,
    },
    allComplete: true,
  };
}

async function archiveCurrentResult(
  supabase: SupabaseClient,
  userId: string,
) {
  const current = await getCurrentResult(supabase, userId);
  if (!current) return;

  const { error } = await supabase.from("assessment_result_history").insert({
    user_id: userId,
    path_scores: current.path_scores,
    top_paths: current.top_paths,
    construct_scores: current.construct_scores ?? {},
    section_scores: current.section_scores ?? current.path_scores,
    completed_at: current.computed_at ?? new Date().toISOString(),
  });

  if (error) {
    console.error("archiveCurrentResult failed:", error.message);
    throw new Error(
      `Could not save previous results before retake. Please run the results history SQL migration. (${error.message})`,
    );
  }
}

export async function loadStudentAssessment(
  supabase: SupabaseClient,
  userId: string,
) {
  const session = await getOrCreateSession(supabase, userId);
  const responses = await loadResponses(supabase, session.id);
  const result = await getCurrentResult(supabase, userId);

  return { session, responses, result };
}

/** Archive current results, then wipe answers and start a fresh session. */
export async function resetAssessment(
  supabase: SupabaseClient,
  userId: string,
) {
  await archiveCurrentResult(supabase, userId);

  // Clear live results even if session cascade does not (query is by user_id).
  await supabase.from("results").delete().eq("user_id", userId);

  const { error: deleteError } = await supabase
    .from("assessment_sessions")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("resetAssessment delete failed:", deleteError.message);
    throw new Error(deleteError.message);
  }

  return getOrCreateSession(supabase, userId, "clinical_care");
}

/** Clear answers for one section so the student can retake it. */
export async function resetSectionResponses(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    userId: string;
    section: SectionKey;
  },
) {
  const { error: responseError } = await supabase
    .from("responses")
    .delete()
    .eq("session_id", params.sessionId)
    .eq("section", params.section);

  if (responseError) {
    console.error("resetSectionResponses failed:", responseError.message);
    throw new Error(responseError.message);
  }

  const { error: sessionError } = await supabase
    .from("assessment_sessions")
    .update({
      status: "in_progress",
      completed_at: null,
      current_section: params.section,
    })
    .eq("id", params.sessionId);

  if (sessionError) {
    console.error("resetSectionResponses session update failed:", sessionError.message);
    throw new Error(sessionError.message);
  }

  await supabase.from("results").delete().eq("user_id", params.userId);
}
