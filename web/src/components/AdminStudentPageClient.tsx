"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SectionProgress from "@/components/admin/SectionProgress";
import ResultsDashboard from "@/components/ResultsDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { normalizeAvatar } from "@/lib/avatars";
import { getSectionCompletion } from "@/lib/scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";
import type { Responses } from "@/lib/types";

export default function AdminStudentPageClient() {
  const ready = useAuthGuard({ admin: true });
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    if (!ready) return;

    if (!studentId) {
      router.replace(withBasePath("/admin"));
      return;
    }

    let cancelled = false;

    async function load() {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_emoji, class_id, advisor_id, class_name, advisor")
        .eq("id", studentId)
        .single();

      if (!profile) {
        if (!cancelled) {
          setContent(
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
            </div>,
          );
        }
        return;
      }

      const [{ data: result }, { data: responseRows }, { data: classRow }, { data: advisorRow }] =
        await Promise.all([
          supabase.from("results").select("*").eq("user_id", studentId).single(),
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
        ]);

      const responses: Responses = {};
      for (const row of responseRows ?? []) {
        responses[row.item_id] = row.rating;
      }

      const sectionCompletion = getSectionCompletion(responses);
      const allComplete = Object.values(sectionCompletion).every((value) => value >= 1);
      const classLabel = classRow?.name ?? profile.class_name ?? null;
      const advisorLabel =
        advisorRow?.full_name?.trim() || advisorRow?.email || profile.advisor || null;
      const displayName = profile.full_name?.trim() || profile.email;

      if (!cancelled) {
        setContent(
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

            {!allComplete && (
              <section className="admin-detail-section">
                <h2 className="admin-detail-section__title">Assessment progress</h2>
                <div className="surface-card p-5 sm:p-6">
                  <SectionProgress responses={responses} />
                </div>
              </section>
            )}

            {result ? (
              <ResultsDashboard
                result={{
                  pathScores: result.path_scores,
                  topPaths: result.top_paths,
                  constructScores: result.construct_scores ?? {},
                  sectionCompletion,
                  allComplete,
                }}
                studentName={profile.full_name ?? undefined}
              />
            ) : (
              !allComplete && (
                <p className="admin-detail-note">
                  Results will appear here once all nine career path sections are complete.
                </p>
              )
            )}

            {allComplete && !result && (
              <div className="surface-card p-5 sm:p-6">
                <p className="text-[15px] text-muted">
                  This student finished all sections but results have not been saved yet. Ask them
                  to open the results page once more.
                </p>
              </div>
            )}
          </>,
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, router, studentId]);

  if (!ready || !content) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <p className="text-[15px] text-muted">Loading student…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-page-content">{content}</div>
    </div>
  );
}
