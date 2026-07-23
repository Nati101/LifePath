import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminDashboardData, AdminStudent, StudentStatus } from "@/lib/admin/dashboardTypes";
import { normalizeAvatar } from "@/lib/avatars";
import { getAllPart2Items } from "@/lib/part2-scoring";
import { getSectionCompletion } from "@/lib/scoring";
import type { Responses } from "@/lib/types";

export type {
  AdminDashboardData,
  AdminFilterOption,
  AdminStudent,
  StudentStatus,
} from "@/lib/admin/dashboardTypes";

function buildResponsesMap(
  rows: { user_id: string; item_id: string; rating: number }[],
): Map<string, Responses> {
  const map = new Map<string, Responses>();
  for (const row of rows) {
    const existing = map.get(row.user_id) ?? {};
    existing[row.item_id] = row.rating;
    map.set(row.user_id, existing);
  }
  return map;
}

function overallProgress(responses: Responses): number {
  const completion = getSectionCompletion(responses);
  const values = Object.values(completion);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100);
}

function part2Progress(responses: Responses): number {
  const total = getAllPart2Items().length;
  if (total === 0) return 0;
  const answered = Object.keys(responses).length;
  return Math.round((answered / total) * 100);
}

function resolveStatus(
  sessionStatus: string | undefined,
  progressPercent: number,
  hasResponses: boolean,
): StudentStatus {
  if (sessionStatus === "completed" || progressPercent >= 100) return "completed";
  if (sessionStatus || hasResponses || progressPercent > 0) return "in_progress";
  return "not_started";
}

export async function fetchDashboardData(
  supabase: SupabaseClient,
): Promise<AdminDashboardData> {
  const empty: AdminDashboardData = {
    students: [],
    schools: [],
    advisors: [],
    stats: { total: 0, completed: 0, inProgress: 0, notStarted: 0, part2Completed: 0 },
    viewerIsSuperAdmin: false,
    scopedToAdvisor: false,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_super_admin, role")
    .eq("id", user.id)
    .single();

  const viewerIsSuperAdmin = Boolean(viewerProfile?.is_super_admin);
  const scopedToAdvisor = viewerProfile?.role === "admin" && !viewerIsSuperAdmin;

  let studentsQuery = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_emoji, school_id, advisor_id, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (scopedToAdvisor) {
    studentsQuery = studentsQuery.eq("advisor_id", user.id);
  }

  const [
    { data: students },
    { data: sessions },
    { data: results },
    { data: schools },
    { data: advisors },
    { data: responseRows },
    { data: part2Sessions },
    { data: part2Results },
    { data: part2ResponseRows },
  ] = await Promise.all([
    studentsQuery,
    supabase.from("assessment_sessions").select("user_id, status, completed_at"),
    supabase
      .from("results")
      .select("user_id, top_paths, computed_at")
      .order("computed_at", { ascending: false }),
    supabase.from("schools").select("id, name").order("name"),
    viewerIsSuperAdmin
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "admin")
          .order("full_name")
      : Promise.resolve({
          data: viewerProfile
            ? [
                {
                  id: viewerProfile.id,
                  full_name: viewerProfile.full_name,
                  email: viewerProfile.email,
                },
              ]
            : [],
        }),
    supabase.from("responses").select("user_id, item_id, rating"),
    supabase.from("part2_sessions").select("user_id, status, id"),
    supabase
      .from("part2_results")
      .select("user_id, top_routes, computed_at")
      .order("computed_at", { ascending: false }),
    supabase.from("part2_responses").select("user_id, item_id, rating"),
  ]);

  const allowedStudentIds = new Set((students ?? []).map((student) => student.id));

  const sessionMap = new Map(
    (sessions ?? [])
      .filter((session) => allowedStudentIds.has(session.user_id))
      .map((session) => [session.user_id, session]),
  );

  const resultMap = new Map<
    string,
    { user_id: string; top_paths: { path?: string; score?: number; overall?: number }[]; computed_at: string }
  >();
  for (const result of results ?? []) {
    if (!allowedStudentIds.has(result.user_id)) continue;
    if (!resultMap.has(result.user_id)) {
      resultMap.set(result.user_id, result);
    }
  }

  const part2SessionMap = new Map(
    (part2Sessions ?? [])
      .filter((session) => allowedStudentIds.has(session.user_id))
      .map((session) => [session.user_id, session]),
  );

  const part2ResultMap = new Map<
    string,
    { user_id: string; top_routes: { route?: string }[]; computed_at: string }
  >();
  for (const result of part2Results ?? []) {
    if (!allowedStudentIds.has(result.user_id)) continue;
    if (!part2ResultMap.has(result.user_id)) {
      part2ResultMap.set(result.user_id, result);
    }
  }

  const schoolMap = new Map(schools?.map((row) => [row.id, row.name]) ?? []);
  const advisorMap = new Map(
    (advisors ?? []).map((row) => [row.id, row.full_name?.trim() || row.email]),
  );
  const responsesMap = buildResponsesMap(
    (responseRows ?? []).filter((row) => allowedStudentIds.has(row.user_id)),
  );
  const part2ResponsesMap = buildResponsesMap(
    (part2ResponseRows ?? []).filter((row) => allowedStudentIds.has(row.user_id)),
  );

  const studentRows: AdminStudent[] =
    students?.map((student) => {
      const session = sessionMap.get(student.id);
      const result = resultMap.get(student.id);
      const responses = responsesMap.get(student.id) ?? {};
      const progressPercent = overallProgress(responses);
      const topPath = result?.top_paths?.[0];

      const part2Session = part2SessionMap.get(student.id);
      const part2Result = part2ResultMap.get(student.id);
      const part2Responses = part2ResponsesMap.get(student.id) ?? {};
      const part2ProgressPercent = part2Progress(part2Responses);
      const topRoute = part2Result?.top_routes?.[0]?.route ?? null;

      return {
        id: student.id,
        email: student.email,
        fullName: student.full_name,
        avatarEmoji: normalizeAvatar(student.avatar_emoji),
        schoolId: student.school_id,
        schoolName: student.school_id ? schoolMap.get(student.school_id) ?? null : null,
        advisorId: student.advisor_id,
        advisorName: student.advisor_id ? advisorMap.get(student.advisor_id) ?? null : null,
        status: resolveStatus(session?.status, progressPercent, Object.keys(responses).length > 0),
        progressPercent,
        topPath: topPath?.path ?? null,
        topPathScore: topPath?.score ?? topPath?.overall ?? null,
        part2Status: resolveStatus(
          part2Session?.status,
          part2ProgressPercent,
          Object.keys(part2Responses).length > 0,
        ),
        part2ProgressPercent,
        topRoute,
        createdAt: student.created_at,
      };
    }) ?? [];

  const stats = {
    total: studentRows.length,
    completed: studentRows.filter((student) => student.status === "completed").length,
    inProgress: studentRows.filter((student) => student.status === "in_progress").length,
    notStarted: studentRows.filter((student) => student.status === "not_started").length,
    part2Completed: studentRows.filter((student) => student.part2Status === "completed").length,
  };

  return {
    students: studentRows,
    schools: schools?.map((row) => ({ id: row.id, name: row.name })) ?? [],
    advisors:
      (advisors ?? []).map((row) => ({
        id: row.id,
        name: row.full_name?.trim() || row.email,
      })) ?? [],
    stats,
    viewerIsSuperAdmin,
    scopedToAdvisor,
  };
}
