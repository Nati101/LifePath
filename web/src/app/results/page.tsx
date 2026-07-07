import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { withBasePath } from "@/lib/supabase/client";
import ResultsDashboard from "@/components/ResultsDashboard";
import {
  ensureProfile,
  getOrCreateSession,
  loadResponses,
  saveResults,
} from "@/lib/assessment/persistence";
import { getSectionCompletion } from "@/lib/scoring";
import type { AssessmentResult } from "@/lib/types";

export default async function ResultsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  let { data: result } = await supabase
    .from("results")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!result) {
    try {
      await ensureProfile(supabase, user);
      const session = await getOrCreateSession(supabase, user.id);
      const responses = await loadResponses(supabase, session.id);
      const completion = getSectionCompletion(responses);
      const allComplete = Object.values(completion).every((c) => c >= 1);

      if (allComplete) {
        const computed = await saveResults(supabase, {
          sessionId: session.id,
          userId: user.id,
          responses,
        });

        result = {
          path_scores: computed.pathScores,
          top_paths: computed.topPaths,
          construct_scores: computed.constructScores,
        };
      }
    } catch (err) {
      console.error("Results recovery failed:", err);
    }
  }

  if (!result) {
    const session = await getOrCreateSession(supabase, user.id).catch(() => null);
    let answeredCount = 0;
    if (session) {
      const responses = await loadResponses(supabase, session.id).catch(() => ({}));
      answeredCount = Object.keys(responses).length;
    }

    return (
      <div className="page-shell justify-center">
        <div className="page-content animate-fade-in text-center">
          <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight">
            No results yet
          </h1>
          <p className="mb-2 text-[15px] leading-relaxed text-muted">
            Complete all four sections to unlock your LifePath snapshot.
          </p>
          {answeredCount > 0 && (
            <p className="mb-8 text-[13px] text-muted-light">
              You&apos;ve answered {answeredCount} of 144 questions so far.
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

  const assessmentResult: AssessmentResult = {
    pathScores: result.path_scores,
    topPaths: result.top_paths,
    constructScores: result.construct_scores ?? {},
    sectionCompletion: {
      interests: 1,
      strengths: 1,
      drivers: 1,
      conditions: 1,
    },
    allComplete: true,
  };

  return (
    <div className="mx-auto max-w-[640px] px-5 py-10 sm:px-8 sm:py-12">
      <ResultsDashboard
        result={assessmentResult}
        studentName={profile?.full_name ?? undefined}
      />
    </div>
  );
}
