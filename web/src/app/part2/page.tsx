"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createClient, withBasePath } from "@/lib/supabase/client";
import { hasPart1Completed, getPart2Session, getPart2Results } from "@/lib/part2-persistence";

export default function Part2Page() {
  const ready = useAuthGuard({ admin: false });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [part1Complete, setPart1Complete] = useState(false);
  const [part2Started, setPart2Started] = useState(false);
  const [part2Complete, setPart2Complete] = useState(false);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      const part1Done = await hasPart1Completed(supabase, user.id);
      setPart1Complete(part1Done);

      if (part1Done) {
        const session = await getPart2Session(supabase, user.id);
        const results = await getPart2Results(supabase, user.id);
        
        setPart2Started(!!session);
        setPart2Complete(!!results);
      }

      setLoading(false);
    }

    void load();
  }, [ready, router]);

  if (!ready || loading) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  if (!part1Complete) {
    return (
      <div className="page-shell py-10 sm:py-12">
        <div className="page-content mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-[2rem] font-semibold tracking-tight">
            My After High School Plan
          </h1>
          <p className="mb-8 text-[16px] leading-relaxed text-muted">
            Before starting Part 2, you need to complete Part 1 (LifePath Career Assessment).
          </p>
          <Link href={withBasePath("/assessment")} className="btn-primary">
            Go to Part 1
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10 sm:py-12">
      <div className="page-content mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="mb-4 text-[2rem] font-semibold tracking-tight">
            My After High School Plan
          </h1>
          <p className="mb-8 text-[16px] leading-relaxed text-muted">
            Plan your next steps after high school. Get personalized route recommendations based on your readiness, preferences, and life situation.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] bg-card p-6 shadow-[var(--shadow)]">
            <h2 className="mb-3 text-[17px] font-semibold">What you'll discover</h2>
            <ul className="space-y-2">
              {[
                "Which post-secondary routes fit your situation best",
                "Your action readiness score",
                "Specific next steps for each route",
                "Timeline and considerations for each path",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-[14px] text-muted-light">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[20px] bg-card p-6 shadow-[var(--shadow)]">
            <h2 className="mb-3 text-[17px] font-semibold">The 6 Routes</h2>
            <div className="space-y-2 text-[14px]">
              <p className="text-muted-light">• University Degree Route</p>
              <p className="text-muted-light">• College / Polytechnic Route</p>
              <p className="text-muted-light">• Trades / Apprenticeship Route</p>
              <p className="text-muted-light">• Work-First + Upgrade Route</p>
              <p className="text-muted-light">• Gap / Explore Route</p>
              <p className="text-muted-light">• Entrepreneur / Create Route</p>
            </div>
          </div>

          <div className="rounded-[20px] bg-card p-6 shadow-[var(--shadow)]">
            <h2 className="mb-3 text-[17px] font-semibold">How it works</h2>
            <ul className="space-y-2">
              {[
                "Answer 31 questions across 4 sections (10-15 minutes)",
                "Questions cover school readiness, preferences, and life factors",
                "Get your top 3 route recommendations",
                "See detailed next steps for each route",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-[14px] text-muted-light">
                  <span className="shrink-0 font-semibold text-primary">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-3 text-center">
          {!part2Started && (
            <Link href={withBasePath("/part2/assessment")} className="btn-primary block">
              Start Part 2 Assessment
            </Link>
          )}
          
          {part2Started && !part2Complete && (
            <Link href={withBasePath("/part2/assessment")} className="btn-primary block">
              Continue Part 2
            </Link>
          )}

          {part2Complete && (
            <>
              <Link href={withBasePath("/part2/results")} className="btn-primary block">
                View Part 2 Results
              </Link>
              <Link
                href={withBasePath("/part2/assessment")}
                className="btn-secondary block"
              >
                Retake Part 2
              </Link>
            </>
          )}

          <Link href={withBasePath("/")} className="block text-[14px] text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
