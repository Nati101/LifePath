"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SectionProgress from "@/components/admin/SectionProgress";
import ResultsAttemptPicker, { formatAttemptDate } from "@/components/ResultsAttemptPicker";
import ResultsDashboard from "@/components/ResultsDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { normalizeAvatar } from "@/lib/avatars";
import {
  listAllAttempts,
  toAssessmentResult,
  type StoredAssessmentResult,
} from "@/lib/assessment/persistence";
import { getSectionCompletion } from "@/lib/scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";
import type { Responses } from "@/lib/types";

export default function AdminStudentPageClient() {
  const ready = useAuthGuard({ admin: true });
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const [header, setHeader] = useState<ReactNode>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [attempts, setAttempts] = useState<StoredAssessmentResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          .select("id, email, full_name, avatar_emoji, class_id, advisor_id, class_name, advisor")
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

      const [{ data: responseRows }, { data: classRow }, { data: advisorRow }, allAttempts] =
        await Promise.all([
          supabase.from("responses").select("item_id, rating").eq("user_id", studentId),
          profile.class_id
            ? supabase.from("classes").select("name").eq("id", profile.class_id).single()
            : Promise.resolve({ data: null }),
          profile.advisor_id
            ? supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", profile.advisor_id)
                .single()
            : Promise.resolve({ data: null }),
          listAllAttempts(supabase, studentId!),
        ]);

      const loadedResponses: Responses = {};
      for (const row of responseRows ?? []) {
        loadedResponses[row.item_id] = row.rating;
      }

      const classLabel = classRow?.name ?? profile.class_name ?? null;
      const advisorLabel =
        advisorRow?.full_name?.trim() || advisorRow?.email || profile.advisor || null;
      const displayName = profile.full_name?.trim() || profile.email;

      if (!cancelled) {
        setResponses(loadedResponses);
        setAttempts(allAttempts);
        setSelectedId(allAttempts[0]?.id ?? null);
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
                  {classLabel && <span className="admin-tag">{classLabel}</span>}
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

  const sectionCompletion = getSectionCompletion(responses);
  const allComplete = Object.values(sectionCompletion).every((value) => value >= 1);

  const pickerOptions = useMemo(() => {
    return attempts.map((attempt) => {
      const date = formatAttemptDate(attempt.computed_at ?? attempt.completed_at);
      const top = attempt.top_paths?.[0]?.path;
      return {
        id: attempt.id,
        label:
          attempt.source === "current"
            ? `Latest result · ${date}`
            : `Previous result · ${date}`,
        sublabel: top,
      };
    });
  }, [attempts]);

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

        {!allComplete && (
          <section className="admin-detail-section">
            <h2 className="admin-detail-section__title">Assessment progress</h2>
            <div className="surface-card p-5 sm:p-6">
              <SectionProgress responses={responses} />
            </div>
          </section>
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
            studentName={undefined}
          />
        ) : (
          !allComplete && (
            <p className="admin-detail-note">
              Results will appear here once all nine career path sections are complete.
            </p>
          )
        )}

        {allComplete && attempts.length === 0 && (
          <div className="surface-card p-5 sm:p-6">
            <p className="text-[15px] text-muted">
              This student finished all sections but results have not been saved yet. Ask them to
              open the results page once more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
