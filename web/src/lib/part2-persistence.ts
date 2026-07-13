import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  Part2Session,
  Part2Response,
  Part2Responses,
  Part2Result,
  Part2SectionKey,
  Part2StoredResult,
} from "./part2-types";
import { computePart2Results, getPart2SectionCompletion } from "./part2-scoring";

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
): Promise<Part2StoredResult | null> {
  const { data, error } = await supabase
    .from("part2_results")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load Part 2 results:", error);
    return null;
  }

  return data;
}

// Check if user has completed Part 1 (required before Part 2)
export async function hasPart1Completed(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("results")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check Part 1 completion:", error);
    return false;
  }

  return !!data;
}
