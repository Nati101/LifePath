"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Part2ResultsDashboard from "@/components/Part2ResultsDashboard";
import ResultsAttemptPicker, { formatAttemptDate } from "@/components/ResultsAttemptPicker";
import {
  getPart2Session,
  loadPart2Responses,
  savePart2Results,
  listAllPart2Attempts,
  toPart2Result,
  type StoredPart2Attempt,
} from "@/lib/part2-persistence";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { getPart2SectionCompletion } from "@/lib/part2-scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function Part2ResultsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [studentName, setStudentName] = useState<string | undefined>();
  const [attempts, setAttempts] = useState<StoredPart2Attempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

      let allAttempts = await listAllPart2Attempts(supabase, user.id);

      if (allAttempts.length === 0) {
        const session = await getPart2Session(supabase, user.id);

        if (session) {
          const responses = await loadPart2Responses(supabase, session.id);
          const completion = getPart2SectionCompletion(responses);
          const allComplete = Object.values(completion).every((c) => c >= 1);

          if (allComplete) {
            try {
              await savePart2Results(supabase, {
                sessionId: session.id,
                userId: user.id,
                responses,
              });
              allAttempts = await listAllPart2Attempts(supabase, user.id);
            } catch (err) {
              console.error("Failed to compute Part 2 results:", err);
            }
          }
        }
      }

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
      const top = attempt.top_routes?.[0]?.route;
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
          <p className="mb-8 text-[15px] leading-relaxed text-muted">
            Complete all My Path sections to see your post-high-school route recommendations.
          </p>
          <Link href={withBasePath("/part2/assessment")} className="btn-primary">
            Go to My Path sections
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
            You started a new My Path attempt. Your previous results are saved below while you
            finish the new one.{" "}
            <Link
              href={withBasePath("/part2/assessment")}
              className="font-medium text-primary underline"
            >
              Continue My Path
            </Link>
          </div>
        )}

        <ResultsAttemptPicker
          attempts={pickerOptions}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
      </div>

      <Part2ResultsDashboard
        result={toPart2Result(selected)}
        studentName={studentName}
      />
    </div>
  );
}
