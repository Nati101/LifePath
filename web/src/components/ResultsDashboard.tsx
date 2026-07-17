"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentResult, PathScore } from "@/lib/types";
import { config } from "@/lib/scoring";
import { pathDetails } from "@/data/path-details";
import { resetAssessment } from "@/lib/assessment/persistence";
import { createClient, withBasePath } from "@/lib/supabase/client";

interface ResultsDashboardProps {
  result: AssessmentResult;
  studentName?: string;
  allowRetake?: boolean;
}

interface PathDetailProps {
  path: PathScore;
  rank: number;
}

function PathDetail({ path, rank }: PathDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = pathDetails[path.path];

  return (
    <div className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-primary">#{rank}</span>
          <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">{path.path}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            {config.pathDescriptions[path.path]}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[1.5rem] font-semibold tabular-nums tracking-tight text-primary">
            {path.score}
          </div>
          <div className="text-[12px] text-muted">{path.fitLevel}</div>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-border/80">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${path.score}%` }}
        />
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary/5"
      >
        {isExpanded ? "Show less" : "Learn more about this path"}
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && details && (
        <div className="mt-5 space-y-5 border-t border-border/50 pt-5 animate-fade-in">
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">What this path is about</h4>
            <p className="text-[13px] leading-relaxed text-muted-light">{details.description}</p>
          </div>

          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">What you'll do</h4>
            <ul className="space-y-1.5">
              {details.whatYoullDo.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted-light">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">Example careers</h4>
            <div className="flex flex-wrap gap-2">
              {details.exampleCareers.map((career, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary"
                >
                  {career}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">Where you might work</h4>
            <div className="flex flex-wrap gap-2">
              {details.workEnvironments.map((env, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-muted/20 px-3 py-1 text-[12px] text-muted-light"
                >
                  {env}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AllPathsDetailProps {
  path: PathScore;
  isTopPath: boolean;
}

function AllPathsDetail({ path, isTopPath }: AllPathsDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = pathDetails[path.path];

  return (
    <div className="rounded-[16px] bg-card shadow-[var(--shadow)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/10"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-[14px] font-medium tracking-tight">{path.path}</span>
          {isTopPath && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              TOP 3
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <div className="text-[15px] font-semibold tabular-nums">{path.score}</div>
            <div className="text-[11px] text-muted">{path.fitLevel}</div>
          </div>
          <svg
            className={`h-4 w-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && details && (
        <div className="space-y-4 border-t border-border/50 px-5 pb-4 pt-4 animate-fade-in">
          <div>
            <p className="text-[12px] leading-relaxed text-muted-light">{details.description}</p>
          </div>

          <div>
            <h4 className="mb-2 text-[12px] font-semibold text-foreground">Example careers</h4>
            <div className="flex flex-wrap gap-1.5">
              {details.exampleCareers.slice(0, 6).map((career, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                >
                  {career}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[12px] font-semibold text-foreground">Where you might work</h4>
            <div className="flex flex-wrap gap-1.5">
              {details.workEnvironments.map((env, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-muted/20 px-2.5 py-0.5 text-[11px] text-muted-light"
                >
                  {env}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsDashboard({
  result,
  studentName,
  allowRetake = false,
}: ResultsDashboardProps) {
  const router = useRouter();
  const { topPaths, pathScores, constructScores, tieNote } = result;
  const [retaking, setRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState<string | null>(null);

  const handleRetake = async () => {
    const confirmed = window.confirm(
      "This starts a new Career Paths attempt. Your previous results will be saved so you can review them later. Continue?",
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

      await resetAssessment(supabase, user.id);
      router.push(withBasePath("/assessment"));
      router.refresh();
    } catch (err) {
      setRetakeError(err instanceof Error ? err.message : "Could not reset assessment");
      setRetaking(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div>
        <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]">
          {studentName ? `${studentName.split(" ")[0]}'s ` : "Your "}snapshot
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-muted">
          These are your strongest starting points right now — not a final answer.
          Use them to explore, ask questions, and try things.
        </p>
      </div>

      {tieNote && (
        <div className="rounded-[16px] bg-primary-light px-4 py-3.5 text-[14px] leading-relaxed text-foreground/80">
          {tieNote}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          Top paths to explore
        </h2>
        <div className="space-y-3">
          {topPaths.map((path, i) => (
            <PathDetail key={path.path} path={path} rank={i + 1} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          All LifePath scores
        </h2>
        <div className="space-y-3">
          {pathScores.map((path) => {
            const isTopPath = topPaths.some((tp) => tp.path === path.path);
            return (
              <AllPathsDetail key={path.path} path={path} isTopPath={isTopPath} />
            );
          })}
        </div>
      </section>

      {Object.keys(constructScores).length > 0 && (
        <section>
          <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
            Work style snapshot
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(constructScores).map(([construct, score]) => (
              <div
                key={construct}
                className="rounded-[16px] bg-card px-4 py-4 shadow-[var(--shadow)]"
              >
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="text-[14px] font-medium tracking-tight">
                    {construct}
                  </span>
                  <span className="text-[14px] font-semibold tabular-nums text-primary">
                    {score}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-border/80">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)] sm:p-6">
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          Try these next
        </h2>
        <ul className="space-y-3">
          {[
            "Watch a 10-min day-in-the-life video for each top path.",
            "Have a 15-min conversation with someone in one of those fields.",
            "Try one related club, elective, or volunteer activity.",
            "Write down: what gave you energy, what drained you, what surprised you.",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 text-[14px] leading-relaxed text-foreground/80"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Retake Assessment */}
      {allowRetake && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleRetake}
            disabled={retaking}
            className="btn-secondary inline-block disabled:opacity-60"
          >
            {retaking ? "Resetting…" : "Retake Assessment"}
          </button>
          <p className="mt-3 text-[13px] text-muted">
            Starts a new attempt. Your previous results stay available on this page.
          </p>
          {retakeError && (
            <p className="mt-2 text-[13px] text-danger">{retakeError}</p>
          )}
        </div>
      )}
    </div>
  );
}
