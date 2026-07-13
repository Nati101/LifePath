"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Part2ResultsDashboard from "@/components/Part2ResultsDashboard";
import {
  getPart2Session,
  loadPart2Responses,
  savePart2Results,
  getPart2Results,
} from "@/lib/part2-persistence";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { getPart2SectionCompletion } from "@/lib/part2-scoring";
import { createClient, withBasePath } from "@/lib/supabase/client";
import type { Part2Result } from "@/lib/part2-types";

export default function Part2ResultsPageClient() {
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

      // Try to load existing results
      let storedResult = await getPart2Results(supabase, user.id);

      // If no results, try to compute from responses
      if (!storedResult) {
        const session = await getPart2Session(supabase, user.id);
        
        if (session) {
          const responses = await loadPart2Responses(supabase, session.id);
          const completion = getPart2SectionCompletion(responses);
          const allComplete = Object.values(completion).every((c) => c >= 1);

          if (allComplete) {
            try {
              const computed = await savePart2Results(supabase, {
                sessionId: session.id,
                userId: user.id,
                responses,
              });

              const result: Part2Result = {
                routeScores: computed.routeScores,
                topRoutes: computed.topRoutes,
                factorScores: computed.factorScores,
                sectionCompletion: completion,
                allComplete: true,
                actionReadiness: computed.actionReadiness,
                actionReadinessLevel: computed.actionReadinessLevel,
                tieNote: computed.tieNote,
              };

              if (!cancelled) {
                setContent(
                  <div className="mx-auto max-w-[640px] px-5 py-10 sm:px-8 sm:py-12">
                    <Part2ResultsDashboard
                      result={result}
                      studentName={profile?.full_name ?? undefined}
                    />
                  </div>,
                );
              }
              return;
            } catch (err) {
              console.error("Failed to compute Part 2 results:", err);
            }
          }
        }
      }

      // If we have stored results, display them
      if (storedResult) {
        const result: Part2Result = {
          routeScores: storedResult.route_scores,
          topRoutes: storedResult.top_routes,
          factorScores: storedResult.factor_scores,
          sectionCompletion: {
            school_setup: 1,
            training_style: 1,
            life_factors: 1,
            exploration: 1,
          },
          allComplete: true,
          actionReadiness: storedResult.action_readiness,
          actionReadinessLevel: storedResult.action_readiness_level,
        };

        if (!cancelled) {
          setContent(
            <div className="mx-auto max-w-[640px] px-5 py-10 sm:px-8 sm:py-12">
              <Part2ResultsDashboard
                result={result}
                studentName={profile?.full_name ?? undefined}
              />
            </div>,
          );
        }
        return;
      }

      // No results available
      if (!cancelled) {
        setContent(
          <div className="page-shell justify-center">
            <div className="page-content animate-fade-in text-center">
              <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight">
                No results yet
              </h1>
              <p className="mb-8 text-[15px] leading-relaxed text-muted">
                Complete all Part 2 sections to see your post-high-school route recommendations.
              </p>
              <Link href={withBasePath("/part2/assessment")} className="btn-primary">
                Go to Part 2 assessment
              </Link>
            </div>
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
