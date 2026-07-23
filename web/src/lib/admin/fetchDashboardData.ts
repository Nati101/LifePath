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

export type FetchDashboardResult = {
  data: AdminDashboardData;
  error: string | null;
};

function emptyDashboard(
  viewerIsSuperAdmin = false,
  scopedToAdvisor = false,
): AdminDashboardData {
  return {
    students: [],
    schools: [],
    advisors: [],
    stats: { total: 0, completed: 0, inProgress: 0, notStarted: 0, part2Completed: 0 },
    viewerIsSuperAdmin,
    scopedToAdvisor,
  };
}

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

function firstError(
  ...results: { error: { message: string } | null }[]
): string | null {
  for (const result of results) {
    if (result.error) return result.error.message;
  }
  return null;
}

export async function fetchDashboardData(
  supabase: SupabaseClient,
): Promise<FetchDashboardResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: emptyDashboard(), error: null };
  }

  const { data: viewerProfile, error: viewerError } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_super_admin, role")
    .eq("id", user.id)
    .single();

  if (viewerError) {
    return { data: emptyDashboard(), error: viewerError.message };
  }

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

  const { data: students, error: studentsError } = await studentsQuery;
  if (studentsError) {
    return {
      data: emptyDashboard(viewerIsSuperAdmin, scopedToAdvisor),
      error: studentsError.message,
    };
  }

  const studentRowsRaw = students ?? [];
  const studentIds = studentRowsRaw.map((student) => student.id);

  if (studentIds.length === 0) {
    const { data: schools } = await supabase.from("schools").select("id, name").order("name");
    return {
      data: {
        ...emptyDashboard(viewerIsSuperAdmin, scopedToAdvisor),
        schools: scopedToAdvisor
          ? []
          : (schools?.map((row) => ({ id: row.id, name: row.name })) ?? []),
        advisors: scopedToAdvisor
          ? []
          : viewerProfile
            ? [
                {
                  id: viewerProfile.id,
                  name: viewerProfile.full_name?.trim() || viewerProfile.email,
                },
              ]
            : [],
      },
      error: null,
    };
  }

  const advisorIds = [
    ...new Set(
      studentRowsRaw
        .map((student) => student.advisor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [
    sessionsResult,
    resultsResult,
    schoolsResult,
    advisorsResult,
    namedAdvisorsResult,
    responseRowsResult,
    part2SessionsResult,
    part2ResultsResult,
    part2ResponseRowsResult,
  ] = await Promise.all([
    supabase
      .from("assessment_sessions")
      .select("user_id, status, completed_at")
      .in("user_id", studentIds),
    supabase
      .from("results")
      .select("user_id, top_paths, computed_at")
      .in("user_id", studentIds)
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
          error: null,
        }),
    advisorIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", advisorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[], error: null }),
    supabase.from("responses").select("user_id, item_id, rating").in("user_id", studentIds),
    supabase.from("part2_sessions").select("user_id, status, id").in("user_id", studentIds),
    supabase
      .from("part2_results")
      .select("user_id, top_routes, computed_at")
      .in("user_id", studentIds)
      .order("computed_at", { ascending: false }),
    supabase.from("part2_responses").select("user_id, item_id, rating").in("user_id", studentIds),
  ]);

  const queryError = firstError(
    sessionsResult,
    resultsResult,
    schoolsResult,
    advisorsResult,
    namedAdvisorsResult,
    responseRowsResult,
    part2SessionsResult,
    part2ResultsResult,
    part2ResponseRowsResult,
  );
  if (queryError) {
    return {
      data: emptyDashboard(viewerIsSuperAdmin, scopedToAdvisor),
      error: queryError,
    };
  }

  const sessions = sessionsResult.data ?? [];
  const results = resultsResult.data ?? [];
  const schools = schoolsResult.data ?? [];
  const advisors = advisorsResult.data ?? [];
  const namedAdvisors = namedAdvisorsResult.data ?? [];
  const responseRows = responseRowsResult.data ?? [];
  const part2Sessions = part2SessionsResult.data ?? [];
  const part2Results = part2ResultsResult.data ?? [];
  const part2ResponseRows = part2ResponseRowsResult.data ?? [];

  const sessionMap = new Map(sessions.map((session) => [session.user_id, session]));

  const resultMap = new Map<
    string,
    { user_id: string; top_paths: { path?: string; score?: number; overall?: number }[]; computed_at: string }
  >();
  for (const result of results) {
    if (!resultMap.has(result.user_id)) {
      resultMap.set(result.user_id, result);
    }
  }

  const part2SessionMap = new Map(part2Sessions.map((session) => [session.user_id, session]));

  const part2ResultMap = new Map<
    string,
    { user_id: string; top_routes: { route?: string }[]; computed_at: string }
  >();
  for (const result of part2Results) {
    if (!part2ResultMap.has(result.user_id)) {
      part2ResultMap.set(result.user_id, result);
    }
  }

  const schoolMap = new Map(schools.map((row) => [row.id, row.name]));
  const advisorNameMap = new Map(
    namedAdvisors.map((row) => [row.id, row.full_name?.trim() || row.email]),
  );
  // Prefer active advisors for the filter list, but keep assigned names even if demoted.
  for (const row of advisors) {
    if (!advisorNameMap.has(row.id)) {
      advisorNameMap.set(row.id, row.full_name?.trim() || row.email);
    }
  }

  const responsesMap = buildResponsesMap(responseRows);
  const part2ResponsesMap = buildResponsesMap(part2ResponseRows);

  const studentRows: AdminStudent[] = studentRowsRaw.map((student) => {
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
      advisorName: student.advisor_id ? advisorNameMap.get(student.advisor_id) ?? null : null,
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
  });

  const usedSchoolIds = new Set(
    studentRows.map((student) => student.schoolId).filter((id): id is string => Boolean(id)),
  );

  const schoolOptions = (schools ?? [])
    .filter((row) => !scopedToAdvisor || usedSchoolIds.has(row.id))
    .map((row) => ({ id: row.id, name: row.name }));

  const advisorOptions = viewerIsSuperAdmin
    ? (advisors ?? []).map((row) => ({
        id: row.id,
        name: row.full_name?.trim() || row.email,
      }))
    : [];

  const stats = {
    total: studentRows.length,
    completed: studentRows.filter((student) => student.status === "completed").length,
    inProgress: studentRows.filter((student) => student.status === "in_progress").length,
    notStarted: studentRows.filter((student) => student.status === "not_started").length,
    part2Completed: studentRows.filter((student) => student.part2Status === "completed").length,
  };

  return {
    data: {
      students: studentRows,
      schools: schoolOptions,
      advisors: advisorOptions,
      stats,
      viewerIsSuperAdmin,
      scopedToAdvisor,
    },
    error: null,
  };
}
