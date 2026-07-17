"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsAttemptPicker, { formatAttemptDate } from "@/components/ResultsAttemptPicker";
import ResultsDashboard from "@/components/ResultsDashboard";
import {
  ensureProfile,
  getOrCreateSession,
  listAllAttempts,
  loadResponses,
  saveResults,
  toAssessmentResult,
  type StoredAssessmentResult,
} from "@/lib/assessment/persistence";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { getSectionCompletion } from "@/lib/scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function ResultsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [studentName, setStudentName] = useState<string | undefined>();
  const [attempts, setAttempts] = useState<StoredAssessmentResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [inProgressRetake, setInProgressRetake] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        if (!cancelled) {
          setSignedOut(true);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      let allAttempts = await listAllAttempts(supabase, user.id);

      if (allAttempts.length === 0) {
        try {
          await ensureProfile(supabase, user);
          const session = await getOrCreateSession(supabase, user.id);
          const responses = await loadResponses(supabase, session.id);
          const completion = getSectionCompletion(responses);
          const allComplete = Object.values(completion).every((c) => c >= 1);

          if (allComplete) {
            await saveResults(supabase, {
              sessionId: session.id,
              userId: user.id,
              responses,
            });
            allAttempts = await listAllAttempts(supabase, user.id);
          } else {
            if (!cancelled) {
              setAnsweredCount(Object.keys(responses).length);
            }
          }
        } catch (err) {
          console.error("Results recovery failed:", err);
        }
      }

      // Detect retake in progress: history exists, no current result.
      const hasCurrent = allAttempts.some((a) => a.source === "current");
      const hasHistory = allAttempts.some((a) => a.source === "history");

      if (!cancelled) {
        setStudentName(profile?.full_name ?? undefined);
        setAttempts(allAttempts);
        setSelectedId(allAttempts[0]?.id ?? null);
        setInProgressRetake(!hasCurrent && hasHistory);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const selected = useMemo(
    () => attempts.find((attempt) => attempt.id === selectedId) ?? attempts[0] ?? null,
    [attempts, selectedId],
  );

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

  if (loading) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading results…</p>
      </div>
    );
  }

  if (signedOut) {
    return (
      <div className="page-shell justify-center">
        <div className="page-content text-center">
          <p className="mb-6 text-[15px] text-muted">Sign in to view your results.</p>
          <Link href={withBasePath("/login")} className="btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="page-shell justify-center">
        <div className="page-content animate-fade-in text-center">
          <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight">
            No results yet
          </h1>
          <p className="mb-2 text-[15px] leading-relaxed text-muted">
            Complete all nine career path sections to unlock your LifePath snapshot.
          </p>
          {answeredCount > 0 && (
            <p className="mb-8 text-[13px] text-muted-light">
              You&apos;ve answered {answeredCount} of 36 questions so far.
            </p>
          )}
          {answeredCount === 0 && <div className="mb-8" />}
          <Link href={withBasePath("/assessment")} className="btn-primary">
            Go to sections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-5 py-10 sm:px-8 sm:py-12">
      <div className="mb-8 space-y-4">
        {inProgressRetake && (
          <div className="rounded-[16px] bg-primary-light px-4 py-3.5 text-[14px] leading-relaxed text-foreground/80">
            You started a new Career Paths attempt. Your previous results are saved below while you
            finish the new one.{" "}
            <Link href={withBasePath("/assessment")} className="font-medium text-primary underline">
              Continue assessment
            </Link>
          </div>
        )}

        <ResultsAttemptPicker
          attempts={pickerOptions}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
      </div>

      <ResultsDashboard
        result={toAssessmentResult(selected)}
        studentName={studentName}
        allowRetake={selected.source === "current"}
      />
    </div>
  );
}
