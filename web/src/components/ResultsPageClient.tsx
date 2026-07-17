"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ResultsDashboard from "@/components/ResultsDashboard";
import {
  ensureProfile,
  getOrCreateSession,
  loadResponses,
  saveResults,
} from "@/lib/assessment/persistence";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { getSectionCompletion } from "@/lib/scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";
import type { AssessmentResult } from "@/lib/types";

export default function ResultsPageClient() {
  const router = useRouter();
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        if (!cancelled) {
          setContent(
            <div className="page-shell justify-center">
              <div className="page-content text-center">
                <p className="mb-6 text-[15px] text-muted">Sign in to view your results.</p>
                <Link href={withBasePath("/login")} className="btn-primary">
                  Sign in
                </Link>
              </div>
            </div>,
          );
        }
        return;
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

        if (!cancelled) {
          setContent(
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
            </div>,
          );
        }
        return;
      }

      const assessmentResult: AssessmentResult = {
        pathScores: result.path_scores,
        topPaths: result.top_paths,
        constructScores: result.construct_scores ?? {},
        sectionCompletion: {
          clinical_care: 1,
          protection: 1,
          learning_support: 1,
          build_fix: 1,
          stem_systems: 1,
          business_leadership: 1,
          creative: 1,
          experience_service: 1,
          outdoor_systems: 1,
        },
        allComplete: true,
      };

      if (!cancelled) {
        setContent(
          <div className="mx-auto max-w-[640px] px-5 py-10 sm:px-8 sm:py-12">
            <ResultsDashboard
              result={assessmentResult}
              studentName={profile?.full_name ?? undefined}
              allowRetake
            />
          </div>,
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!content) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading results…</p>
      </div>
    );
  }

  return content;
}
