"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { appPath, createClient, withBasePath } from "@/lib/supabase/client";
import {
  getOrCreatePart2Session,
  loadPart2Responses,
  resetPart2Assessment,
  getPart2Results,
  hasPart1Completed,
  savePart2Results,
} from "@/lib/part2-persistence";
import { getPart2Config, getPart2SectionCompletion, getPart2SectionOrder } from "@/lib/part2-scoring";
import type { Part2Responses } from "@/lib/part2-types";

export default function Part2AssessmentHub() {
  const [responses, setResponses] = useState<Part2Responses>({});
  const [loading, setLoading] = useState(true);
  const [allComplete, setAllComplete] = useState(false);
  const [part1Incomplete, setPart1Incomplete] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retaking, setRetaking] = useState(false);

  const config = getPart2Config();
  const sectionOrder = getPart2SectionOrder();

  const loadProgress = useCallback(async () => {
    setLoadError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.replace(appPath("/login"));
      setLoading(false);
      return;
    }

    try {
      const part1Done = await hasPart1Completed(supabase, user.id);
      if (!part1Done) {
        setPart1Incomplete(true);
        setLoading(false);
        return;
      }

      const session = await getOrCreatePart2Session(supabase, user.id);
      const map = await loadPart2Responses(supabase, session.id);
      setResponses(map);

      const completion = getPart2SectionCompletion(map);
      const complete = Object.values(completion).every((c) => c >= 1);
      setAllComplete(complete);

      if (complete) {
        const results = await getPart2Results(supabase, user.id);
        if (!results) {
          await savePart2Results(supabase, {
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
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const onFocus = () => void loadProgress();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadProgress]);

  const handleRetakeAll = async () => {
    const confirmed = window.confirm(
      "This starts a new My Path attempt. Your previous results will be saved so you can review them later. Continue?",
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
        window.location.replace(appPath("/login"));
        return;
      }

      await resetPart2Assessment(supabase, user.id);
      setResponses({});
      setAllComplete(false);
      window.location.assign(appPath("/part2/assessment/school_setup"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not reset assessment");
      setRetaking(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (part1Incomplete) {
    return (
      <div className="page-shell centered">
        <div className="page-content text-center">
          <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight">
            Complete Part 1 First
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-muted">
            My Path After High School requires you to complete Part 1 (LifePath Career Assessment)
            first.
          </p>
          <Link href={withBasePath("/assessment")} className="btn-primary">
            Go to Part 1
          </Link>
        </div>
      </div>
    );
  }

  const completion = getPart2SectionCompletion(responses);

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
          Complete all four My Path sections to unlock your route recommendations. You can reopen
          any finished section to change answers.
        </p>

        <div className="mb-10 space-y-3">
          {sectionOrder.map((key) => {
            const pct = Math.round((completion[key] ?? 0) * 100);
            const done = pct >= 100;
            const section = config.sections[key];

            return (
              <Link
                key={key}
                href={withBasePath(`/part2/assessment/${key}`)}
                className={`
                  block rounded-2xl border bg-card px-5 py-4 transition-colors
                  ${done ? "border-primary bg-primary-light" : "border-border hover:border-primary"}
                `}
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-[15px] font-medium text-foreground">{section.label}</span>
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
            <Link href={withBasePath("/part2/results")} className="btn-primary block text-center">
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
