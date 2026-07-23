"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createClient, withBasePath } from "@/lib/supabase/client";
import {
  hasPart1Completed,
  getPart2Session,
  getPart2Results,
  resetPart2Assessment,
} from "@/lib/part2-persistence";

export default function Part2Page() {
  const ready = useAuthGuard({ admin: false });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [part1Complete, setPart1Complete] = useState(false);
  const [part2Started, setPart2Started] = useState(false);
  const [part2Complete, setPart2Complete] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

  const handleRetake = async () => {
    const confirmed = window.confirm(
      "This starts a new My Path attempt. Your previous results will be saved so you can review them later. Continue?",
    );
    if (!confirmed) return;

    setRetaking(true);
    setRetakeError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      await resetPart2Assessment(supabase, user.id);
      router.push(withBasePath("/part2/assessment/school_setup"));
      router.refresh();
    } catch (err) {
      setRetakeError(err instanceof Error ? err.message : "Could not reset assessment");
      setRetaking(false);
    }
  };

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
            My Path After High School
          </h1>
          <p className="mb-8 text-[16px] leading-relaxed text-muted">
            Before starting My Path, you need to complete Part 1 (LifePath Career Assessment).
          </p>
          <Link href={withBasePath("/assessment")} className="btn-primary">
            Go to Part 1
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in mx-auto max-w-md text-center">
        <h1 className="mb-3 text-[28px] font-semibold tracking-tight text-foreground">
          My Path After High School
        </h1>
        <p className="mb-8 text-[16px] leading-relaxed text-muted">
          Get personalized post-secondary route recommendations across four short sections — about
          10–15 minutes.
        </p>

        <div className="space-y-3">
          {!part2Started && (
            <Link href={withBasePath("/part2/assessment")} className="btn-primary block">
              Start My Path
            </Link>
          )}

          {part2Started && !part2Complete && (
            <Link href={withBasePath("/part2/assessment")} className="btn-primary block">
              Continue My Path
            </Link>
          )}

          {part2Complete && (
            <>
              <Link href={withBasePath("/part2/results")} className="btn-primary block">
                View My Path Results
              </Link>
              <Link href={withBasePath("/part2/assessment")} className="btn-secondary block">
                Review sections
              </Link>
              <button
                type="button"
                onClick={handleRetake}
                disabled={retaking}
                className="btn-secondary w-full disabled:opacity-60"
              >
                {retaking ? "Resetting…" : "Retake My Path"}
              </button>
              {retakeError && <p className="text-[13px] text-danger">{retakeError}</p>}
            </>
          )}

          <Link href={withBasePath("/")} className="block pt-2 text-[14px] text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
