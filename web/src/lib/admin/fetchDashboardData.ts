import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminDashboardData, AdminStudent, StudentStatus } from "@/lib/admin/dashboardTypes";
import { normalizeAvatar } from "@/lib/avatars";
import { getSectionCompletion } from "@/lib/scoring";
import type { Responses } from "@/lib/types";

export type { AdminDashboardData, AdminFilterOption, AdminStudent, StudentStatus } from "@/lib/admin/dashboardTypes";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      students: [],
      classes: [],
      advisors: [],
      stats: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
      viewerIsSuperAdmin: false,
      scopedToAdvisor: false,
    };
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_super_admin, role")
    .eq("id", user.id)
    .single();

  const viewerIsSuperAdmin = Boolean(viewerProfile?.is_super_admin);
  const scopedToAdvisor = viewerProfile?.role === "admin" && !viewerIsSuperAdmin;

  let studentsQuery = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_emoji, class_id, advisor_id, class_name, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (scopedToAdvisor) {
    studentsQuery = studentsQuery.eq("advisor_id", user.id);
  }

  const [
    { data: students },
    { data: sessions },
    { data: results },
    { data: classes },
    { data: advisors },
    { data: responseRows },
  ] = await Promise.all([
    studentsQuery,
    supabase.from("assessment_sessions").select("user_id, status, completed_at"),
    supabase.from("results").select("user_id, top_paths, computed_at").order("computed_at", { ascending: false }),
    supabase.from("classes").select("id, name").order("name"),
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
  ]);

  const allowedStudentIds = new Set((students ?? []).map((student) => student.id));

  const sessionMap = new Map(
    (sessions ?? [])
      .filter((session) => allowedStudentIds.has(session.user_id))
      .map((session) => [session.user_id, session]),
  );
  const resultMap = new Map<string, { user_id: string; top_paths: any; computed_at: string }>();
  for (const result of results ?? []) {
    if (!allowedStudentIds.has(result.user_id)) continue;
    if (!resultMap.has(result.user_id)) {
      resultMap.set(result.user_id, result);
    }
  }
  const classMap = new Map(classes?.map((row) => [row.id, row.name]) ?? []);
  const advisorMap = new Map(
    (advisors ?? []).map((row) => [row.id, row.full_name?.trim() || row.email]),
  );
  const responsesMap = buildResponsesMap(
    (responseRows ?? []).filter((row) => allowedStudentIds.has(row.user_id)),
  );

  const studentRows: AdminStudent[] =
    students?.map((student) => {
      const session = sessionMap.get(student.id);
      const result = resultMap.get(student.id);
      const responses = responsesMap.get(student.id) ?? {};
      const progressPercent = overallProgress(responses);
      const topPath = result?.top_paths?.[0];
      const className =
        (student.class_id && classMap.get(student.class_id)) || student.class_name || null;

      return {
        id: student.id,
        email: student.email,
        fullName: student.full_name,
        avatarEmoji: normalizeAvatar(student.avatar_emoji),
        classId: student.class_id,
        className,
        advisorId: student.advisor_id,
        advisorName: student.advisor_id ? advisorMap.get(student.advisor_id) ?? null : null,
        status: resolveStatus(session?.status, progressPercent, Object.keys(responses).length > 0),
        progressPercent,
        topPath: topPath?.path ?? null,
        topPathScore: topPath?.score ?? topPath?.overall ?? null,
        createdAt: student.created_at,
      };
    }) ?? [];

  const stats = {
    total: studentRows.length,
    completed: studentRows.filter((student) => student.status === "completed").length,
    inProgress: studentRows.filter((student) => student.status === "in_progress").length,
    notStarted: studentRows.filter((student) => student.status === "not_started").length,
  };

  return {
    students: studentRows,
    classes: classes?.map((row) => ({ id: row.id, name: row.name })) ?? [],
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
