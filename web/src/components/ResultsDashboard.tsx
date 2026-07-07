"use client";

import type { AssessmentResult } from "@/lib/types";
import { config } from "@/lib/scoring";

interface ResultsDashboardProps {
  result: AssessmentResult;
  studentName?: string;
}

export default function ResultsDashboard({ result, studentName }: ResultsDashboardProps) {
  const { topPaths, pathScores, constructScores, tieNote } = result;

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
            <div
              key={path.path}
              className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[12px] font-semibold text-primary">
                    #{i + 1}
                  </span>
                  <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">
                    {path.path}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                    {config.pathDescriptions[path.path]}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[1.5rem] font-semibold tabular-nums tracking-tight text-primary">
                    {path.overall}
                  </div>
                  <div className="text-[12px] text-muted">{path.fitLevel}</div>
                </div>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-border/80">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${path.overall}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          All LifePath scores
        </h2>
        <div className="overflow-hidden rounded-[20px] bg-card shadow-[var(--shadow)]">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-5 py-3 text-left text-[12px] font-medium text-muted">
                  Path
                </th>
                <th className="px-5 py-3 text-right text-[12px] font-medium text-muted">
                  Score
                </th>
                <th className="hidden px-5 py-3 text-right text-[12px] font-medium text-muted sm:table-cell">
                  Fit
                </th>
              </tr>
            </thead>
            <tbody>
              {pathScores.map((p) => (
                <tr
                  key={p.path}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-5 py-3.5 font-medium tracking-tight">{p.path}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                    {p.overall}
                  </td>
                  <td className="hidden px-5 py-3.5 text-right text-muted sm:table-cell">
                    {p.fitLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
