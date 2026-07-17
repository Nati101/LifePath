import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Part2Session,
  Part2Responses,
  Part2Result,
  Part2SectionKey,
  Part2StoredResult,
} from "./part2-types";
import { computePart2Results } from "./part2-scoring";
import { getCurrentResult, listResultHistory } from "./assessment/persistence";

export interface StoredPart2Attempt extends Part2StoredResult {
  source: "current" | "history";
  completed_at?: string;
  archived_at?: string;
}

export async function getPart2Session(
  supabase: SupabaseClient,
  userId: string,
): Promise<Part2Session | null> {
  const { data, error } = await supabase
    .from("part2_sessions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load Part 2 session:", error);
    return null;
  }

  return data;
}

export async function getOrCreatePart2Session(
  supabase: SupabaseClient,
  userId: string,
): Promise<Part2Session> {
  const existingSession = await getPart2Session(supabase, userId);

  if (existingSession) {
    return existingSession;
  }

  const { data, error } = await supabase
    .from("part2_sessions")
    .insert({
      user_id: userId,
      status: "in_progress",
      current_section: "school_setup",
      current_index: 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create Part 2 session: ${error?.message || "Unknown error"}`);
  }

  return data;
}

export async function loadPart2Responses(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<Part2Responses> {
  const { data, error } = await supabase
    .from("part2_responses")
    .select("item_id, rating")
    .eq("session_id", sessionId);

  if (error) {
    console.error("Failed to load Part 2 responses:", error);
    return {};
  }

  const responses: Part2Responses = {};
  for (const row of data || []) {
    responses[row.item_id] = row.rating;
  }

  return responses;
}

export async function savePart2Response(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    userId: string;
    itemId: string;
    section: Part2SectionKey;
    rating: number;
  },
): Promise<void> {
  const { error } = await supabase.from("part2_responses").upsert(
    {
      session_id: params.sessionId,
      user_id: params.userId,
      item_id: params.itemId,
      section: params.section,
      rating: params.rating,
    },
    {
      onConflict: "session_id,item_id",
    },
  );

  if (error) {
    throw new Error(`Failed to save Part 2 response: ${error.message}`);
  }
}

export async function updatePart2Session(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    currentSection: Part2SectionKey;
    currentIndex: number;
    status?: "in_progress" | "completed";
  },
): Promise<void> {
  const updates: Partial<Part2Session> = {
    current_section: params.currentSection,
    current_index: params.currentIndex,
  };

  if (params.status === "completed") {
    updates.status = "completed";
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("part2_sessions")
    .update(updates)
    .eq("id", params.sessionId);

  if (error) {
    throw new Error(`Failed to update Part 2 session: ${error.message}`);
  }
}

export async function savePart2Results(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    userId: string;
    responses: Part2Responses;
  },
): Promise<Part2Result> {
  const result = computePart2Results(params.responses);

  const { error } = await supabase.from("part2_results").upsert(
    {
      session_id: params.sessionId,
      user_id: params.userId,
      route_scores: result.routeScores,
      top_routes: result.topRoutes,
      factor_scores: result.factorScores,
      action_readiness: result.actionReadiness,
      action_readiness_level: result.actionReadinessLevel,
    },
    {
      onConflict: "session_id",
    },
  );

  if (error) {
    throw new Error(`Failed to save Part 2 results: ${error.message}`);
  }

  return result;
}

export async function getPart2Results(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredPart2Attempt | null> {
  const { data, error } = await supabase
    .from("part2_results")
    .select("*")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load Part 2 results:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    source: "current",
  };
}

export async function listPart2ResultHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredPart2Attempt[]> {
  const { data, error } = await supabase
    .from("part2_result_history")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("listPart2ResultHistory failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    session_id: "",
    computed_at: row.completed_at,
    source: "history" as const,
  }));
}

export async function listAllPart2Attempts(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoredPart2Attempt[]> {
  const [current, history] = await Promise.all([
    getPart2Results(supabase, userId),
    listPart2ResultHistory(supabase, userId),
  ]);

  return [...(current ? [current] : []), ...history];
}

export function toPart2Result(stored: StoredPart2Attempt): Part2Result {
  return {
    routeScores: stored.route_scores,
    topRoutes: stored.top_routes,
    factorScores: stored.factor_scores,
    sectionCompletion: {
      school_setup: 1,
      training_style: 1,
      life_factors: 1,
      exploration: 1,
    },
    allComplete: true,
    actionReadiness: stored.action_readiness,
    actionReadinessLevel: stored.action_readiness_level,
  };
}

async function archiveCurrentPart2Result(
  supabase: SupabaseClient,
  userId: string,
) {
  const current = await getPart2Results(supabase, userId);
  if (!current) return;

  const { error } = await supabase.from("part2_result_history").insert({
    user_id: userId,
    route_scores: current.route_scores,
    top_routes: current.top_routes,
    factor_scores: current.factor_scores,
    action_readiness: current.action_readiness,
    action_readiness_level: current.action_readiness_level,
    completed_at: current.computed_at ?? new Date().toISOString(),
  });

  if (error) {
    console.error("archiveCurrentPart2Result failed:", error.message);
    throw new Error(
      `Could not save previous Part 2 results before retake. Please run the results history SQL migration. (${error.message})`,
    );
  }
}

/** True if student has ever completed Part 1 (current or archived). */
export async function hasPart1Completed(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const current = await getCurrentResult(supabase, userId);
  if (current) return true;

  const history = await listResultHistory(supabase, userId);
  return history.length > 0;
}

/** Archive current Part 2 results, then wipe answers and start fresh. */
export async function resetPart2Assessment(
  supabase: SupabaseClient,
  userId: string,
): Promise<Part2Session> {
  await archiveCurrentPart2Result(supabase, userId);

  const { error: deleteError } = await supabase
    .from("part2_sessions")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("resetPart2Assessment delete failed:", deleteError.message);
    throw new Error(deleteError.message);
  }

  return getOrCreatePart2Session(supabase, userId);
}
