import type { SupabaseClient } from "@supabase/supabase-js";
import { computeResults } from "@/lib/scoring";
import type { Responses, SectionKey } from "@/lib/types";

export async function ensureProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
) {
  // Signup trigger usually creates the row; this is a no-op if it already exists.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string) ?? "",
      role: "student",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (error) {
    // Concurrent signup can still race; treat existing profile as success.
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
    // Another request may have created the session first.
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

export async function loadStudentAssessment(
  supabase: SupabaseClient,
  userId: string,
) {
  const session = await getOrCreateSession(supabase, userId);
  const responses = await loadResponses(supabase, session.id);

  const { data: result } = await supabase
    .from("results")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { session, responses, result };
}
