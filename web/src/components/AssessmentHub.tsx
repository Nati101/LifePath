"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";
import {
  ensureProfile,
  getOrCreateSession,
  loadResponses,
  resetAssessment,
  saveResults,
} from "@/lib/assessment/persistence";
import { sectionLabels, sectionOrder } from "@/data/instructions";
import { getSectionCompletion } from "@/lib/scoring";
import type { Responses } from "@/lib/types";

export default function AssessmentHub() {
  const router = useRouter();
  const [responses, setResponses] = useState<Responses>({});
  const [loading, setLoading] = useState(true);
  const [allComplete, setAllComplete] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retaking, setRetaking] = useState(false);

  const loadProgress = useCallback(async () => {
    setLoadError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace(withBasePath("/login"));
      return;
    }

    try {
      await ensureProfile(supabase, user);
      const session = await getOrCreateSession(supabase, user.id);
      const map = await loadResponses(supabase, session.id);
      setResponses(map);

      const completion = getSectionCompletion(map);
      const complete = Object.values(completion).every((c) => c >= 1);
      setAllComplete(complete);

      if (complete) {
        const { data: existingResult } = await supabase
          .from("results")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingResult) {
          await saveResults(supabase, {
            sessionId: session.id,
            userId: user.id,
            responses: map,
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load progress";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const onFocus = () => loadProgress();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadProgress]);

  const handleRetakeAll = async () => {
    const confirmed = window.confirm(
      "This will clear all your Career Paths answers and results so you can start fresh. Continue?",
    );
    if (!confirmed) return;

    setRetaking(true);
    setLoadError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      await resetAssessment(supabase, user.id);
      setResponses({});
      setAllComplete(false);
      router.push(withBasePath("/assessment/clinical_care"));
      router.refresh();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not reset assessment");
      setRetaking(false);
    }
  };

  const completion = getSectionCompletion(responses);

  if (loading) {
    return (
      <div className="page-shell justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-content animate-fade-in w-full">
        {loadError && (
          <p className="mb-6 text-center text-sm text-danger">{loadError}</p>
        )}

        <h1 className="mb-1 text-[22px] font-semibold tracking-tight text-foreground">
          Your sections
        </h1>
        <p className="mb-8 text-[14px] text-muted">
          Complete all nine career path sections to unlock your results. You can reopen any
          finished section to change answers.
        </p>

        <div className="mb-10 space-y-3">
          {sectionOrder.map((key) => {
            const pct = Math.round((completion[key] ?? 0) * 100);
            const done = pct >= 100;

            return (
              <Link
                key={key}
                href={withBasePath(`/assessment/${key}`)}
                className={`
                  block rounded-2xl border bg-card px-5 py-4 transition-colors
                  ${done ? "border-primary bg-primary-light" : "border-border hover:border-primary"}
                `}
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-[15px] font-medium text-foreground">
                    {sectionLabels[key]}
                  </span>
                  <span className="text-sm tabular-nums text-muted">
                    {done ? "Done · Review" : `${pct}%`}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {allComplete ? (
          <div className="space-y-3">
            <Link href={withBasePath("/results")} className="btn-primary block text-center">
              View results
            </Link>
            <button
              type="button"
              onClick={handleRetakeAll}
              disabled={retaking}
              className="btn-secondary w-full disabled:opacity-60"
            >
              {retaking ? "Resetting…" : "Retake all sections"}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-light">
            Results unlock after all sections are complete.
          </p>
        )}
      </div>
    </div>
  );
}
