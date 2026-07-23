"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SectionProgress from "@/components/admin/SectionProgress";
import Part2SectionProgress from "@/components/admin/Part2SectionProgress";
import ResultsAttemptPicker, { formatAttemptDate } from "@/components/ResultsAttemptPicker";
import ResultsDashboard from "@/components/ResultsDashboard";
import Part2ResultsDashboard from "@/components/Part2ResultsDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { normalizeAvatar } from "@/lib/avatars";
import {
  listAllAttempts,
  toAssessmentResult,
  type StoredAssessmentResult,
} from "@/lib/assessment/persistence";
import {
  getPart2Session,
  listAllPart2Attempts,
  loadPart2Responses,
  toPart2Result,
  type StoredPart2Attempt,
} from "@/lib/part2-persistence";
import { getSectionCompletion } from "@/lib/scoring";
import { getAllPart2Items } from "@/lib/part2-scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";
import type { Responses } from "@/lib/types";
import type { Part2Responses } from "@/lib/part2-types";

export default function AdminStudentPageClient() {
  const ready = useAuthGuard({ admin: true });
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const [header, setHeader] = useState<ReactNode>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [part2Responses, setPart2Responses] = useState<Part2Responses>({});
  const [attempts, setAttempts] = useState<StoredAssessmentResult[]>([]);
  const [part2Attempts, setPart2Attempts] = useState<StoredPart2Attempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPart2Id, setSelectedPart2Id] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [studentName, setStudentName] = useState<string | undefined>();

  useEffect(() => {
    if (!ready) return;

    if (!studentId) {
      router.replace(withBasePath("/admin"));
      return;
    }

    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      const [{ data: viewerProfile }, { data: profile }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, is_super_admin, role")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_emoji, school_id, advisor_id, advisor")
          .eq("id", studentId)
          .single(),
      ]);

      if (!profile) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const isSuperAdmin = Boolean(viewerProfile?.is_super_admin);
      const canView =
        isSuperAdmin ||
        (viewerProfile?.role === "admin" && profile.advisor_id === user.id);

      if (!canView) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const [
        { data: responseRows },
        { data: schoolRow },
        { data: advisorRow },
        allAttempts,
        allPart2Attempts,
        part2Session,
      ] = await Promise.all([
        supabase.from("responses").select("item_id, rating").eq("user_id", studentId),
        profile.school_id
          ? supabase.from("schools").select("name").eq("id", profile.school_id).single()
          : Promise.resolve({ data: null }),
        profile.advisor_id
          ? supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", profile.advisor_id)
              .single()
          : Promise.resolve({ data: null }),
        listAllAttempts(supabase, studentId!),
        listAllPart2Attempts(supabase, studentId!),
        getPart2Session(supabase, studentId!),
      ]);

      let loadedPart2: Part2Responses = {};
      if (part2Session) {
        loadedPart2 = await loadPart2Responses(supabase, part2Session.id);
      }

      const loadedResponses: Responses = {};
      for (const row of responseRows ?? []) {
        loadedResponses[row.item_id] = row.rating;
      }

      const part1Complete = Object.values(getSectionCompletion(loadedResponses)).every(
        (value) => value >= 1,
      );
      const part2ItemCount = getAllPart2Items().length;
      const part2CompleteNow =
        part2ItemCount > 0 && Object.keys(loadedPart2).length >= part2ItemCount;

      // While an attempt is in progress, only show archived history — never a live snapshot.
      const visiblePart1 = part1Complete
        ? allAttempts
        : allAttempts.filter((attempt) => attempt.source === "history");
      const visiblePart2 = part2CompleteNow
        ? allPart2Attempts
        : allPart2Attempts.filter((attempt) => attempt.source === "history");

      const schoolLabel = schoolRow?.name ?? null;
      const advisorLabel =
        advisorRow?.full_name?.trim() || advisorRow?.email || profile.advisor || null;
      const displayName = profile.full_name?.trim() || profile.email;

      if (!cancelled) {
        setResponses(loadedResponses);
        setPart2Responses(loadedPart2);
        setAttempts(visiblePart1);
        setPart2Attempts(visiblePart2);
        setSelectedId(visiblePart1[0]?.id ?? null);
        setSelectedPart2Id(visiblePart2[0]?.id ?? null);
        setStudentName(displayName);
        setHeader(
          <>
            <Link href={withBasePath("/admin")} className="admin-back-link">
              ← Back to admin
            </Link>

            <div className="admin-student-header surface-card">
              <span className="admin-student-header__avatar" aria-hidden>
                {normalizeAvatar(profile.avatar_emoji)}
              </span>
              <div>
                <h1 className="admin-student-header__name">{displayName}</h1>
                <p className="admin-student-header__meta">{profile.email}</p>
                <div className="admin-student-header__tags">
                  {schoolLabel && <span className="admin-tag">{schoolLabel}</span>}
                  {advisorLabel && <span className="admin-tag">Advisor: {advisorLabel}</span>}
                </div>
              </div>
            </div>
          </>,
        );
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, router, studentId]);

  const selected = useMemo(
    () => attempts.find((attempt) => attempt.id === selectedId) ?? attempts[0] ?? null,
    [attempts, selectedId],
  );

  const selectedPart2 = useMemo(
    () =>
      part2Attempts.find((attempt) => attempt.id === selectedPart2Id) ??
      part2Attempts[0] ??
      null,
    [part2Attempts, selectedPart2Id],
  );

  const sectionCompletion = getSectionCompletion(responses);
  const allComplete = Object.values(sectionCompletion).every((value) => value >= 1);
  const part2Total = getAllPart2Items().length;
  const part2Answered = Object.keys(part2Responses).length;
  const part2Complete = part2Total > 0 && part2Answered >= part2Total;

  const pickerOptions = useMemo(() => {
    return attempts.map((attempt) => {
      const date = formatAttemptDate(attempt.computed_at ?? attempt.completed_at);
      const top = attempt.top_paths?.[0]?.path;
      const isHistory = attempt.source === "history";
      return {
        id: attempt.id,
        label: allComplete
          ? attempt.source === "current"
            ? `Latest result · ${date}`
            : `Previous result · ${date}`
          : `Previous completed · ${date}`,
        sublabel: top ?? (isHistory ? "Archived" : undefined),
      };
    });
  }, [attempts, allComplete]);

  const part2PickerOptions = useMemo(() => {
    return part2Attempts.map((attempt) => {
      const date = formatAttemptDate(attempt.computed_at ?? attempt.completed_at);
      const top = attempt.top_routes?.[0]?.route;
      return {
        id: attempt.id,
        label: part2Complete
          ? attempt.source === "current"
            ? `Latest Part 2 · ${date}`
            : `Previous Part 2 · ${date}`
          : `Previous Part 2 · ${date}`,
        sublabel: top,
      };
    });
  }, [part2Attempts, part2Complete]);

  if (!ready || loading) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <p className="text-[15px] text-muted">Loading student…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <div className="page-shell justify-center">
            <div className="page-content text-center">
              <p className="mb-6 text-[15px] text-muted">Student not found.</p>
              <Link
                href={withBasePath("/admin")}
                className="text-[14px] font-medium text-primary transition-opacity hover:opacity-80"
              >
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-page-content space-y-6">
        {header}

        <section className="admin-detail-section">
          <h2 className="admin-detail-section__title">Part 1</h2>

          {!allComplete && (
            <div className="surface-card mb-4 p-5 sm:p-6">
              <p className="mb-4 text-[14px] text-muted">
                Current attempt is still in progress
                {Object.keys(responses).length > 0
                  ? ` (${Object.keys(responses).length} answers so far).`
                  : "."}
              </p>
              <SectionProgress responses={responses} />
            </div>
          )}

          {!allComplete && attempts.length > 0 && (
            <p className="admin-detail-note mb-4">
              Snapshot below is from a previous completed attempt, not the current one.
            </p>
          )}

          {attempts.length > 0 && (
            <ResultsAttemptPicker
              attempts={pickerOptions}
              selectedId={selected?.id ?? ""}
              onSelect={setSelectedId}
            />
          )}

          {selected ? (
            <ResultsDashboard
              result={toAssessmentResult(selected)}
              studentName={studentName}
              allowRetake={false}
            />
          ) : (
            !allComplete && (
              <p className="admin-detail-note">
                Part 1 results will appear here once all career path sections are complete.
              </p>
            )
          )}

          {allComplete && attempts.length === 0 && (
            <div className="surface-card p-5 sm:p-6">
              <p className="text-[15px] text-muted">
                This student finished Part 1 but results have not been saved yet. Ask them to open
                the results page once more.
              </p>
            </div>
          )}
        </section>

        <section className="admin-detail-section">
          <h2 className="admin-detail-section__title">Part 2</h2>
          {!part2Complete && (
            <div className="surface-card mb-4 p-5 sm:p-6">
              {part2Answered === 0 ? (
                <p className="text-[14px] text-muted">This student has not started Part 2 yet.</p>
              ) : (
                <>
                  <p className="mb-4 text-[14px] text-muted">
                    Current Part 2 attempt is still in progress ({part2Answered} answers so far).
                  </p>
                  <Part2SectionProgress responses={part2Responses} />
                </>
              )}
            </div>
          )}

          {!part2Complete && part2Attempts.length > 0 && (
            <p className="admin-detail-note mb-4">
              Route results below are from a previous completed Part 2 attempt.
            </p>
          )}

          {part2Attempts.length > 0 && (
            <ResultsAttemptPicker
              attempts={part2PickerOptions}
              selectedId={selectedPart2?.id ?? ""}
              onSelect={setSelectedPart2Id}
            />
          )}

          {selectedPart2 ? (
            <Part2ResultsDashboard
              result={toPart2Result(selectedPart2)}
              studentName={studentName}
            />
          ) : (
            part2Complete && (
              <p className="admin-detail-note">
                Part 2 is complete but results have not been saved yet.
              </p>
            )
          )}
        </section>
      </div>
    </div>
  );
}
