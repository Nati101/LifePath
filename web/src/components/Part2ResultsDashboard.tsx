"use client";

import { useState } from "react";
import type { Part2Result, Part2RouteScore } from "@/lib/part2-types";
import { part2Config } from "@/lib/part2-scoring";
import { part2RouteDetails } from "@/data/part2-route-details";

interface Part2ResultsDashboardProps {
  result: Part2Result;
  studentName?: string;
}

interface RouteDetailCardProps {
  route: Part2RouteScore;
  rank: number;
}

function RouteDetailCard({ route, rank }: RouteDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = part2RouteDetails[route.route];

  if (!details) return null;

  return (
    <div className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-primary">#{rank}</span>
          <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">{route.route}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            {part2Config.routeDescriptions[route.route]}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[1.5rem] font-semibold tabular-nums tracking-tight text-primary">
            {route.score}
          </div>
          <div className="text-[12px] text-muted">{route.fitLevel}</div>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-border/80">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${route.score}%` }}
        />
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary/5"
      >
        {isExpanded ? "Show less" : "See next steps & details"}
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-5 border-t border-border/50 pt-5 animate-fade-in">
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">What it involves</h4>
            <ul className="space-y-1.5">
              {details.whatItInvolves.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted-light">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">Best fit for</h4>
            <ul className="space-y-1.5">
              {details.bestFitFor.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted-light">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-foreground">Your next 5 steps</h4>
            <ol className="space-y-2">
              {details.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground">
                  <span className="shrink-0 font-semibold text-primary">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg bg-muted/20 px-3 py-3">
            <p className="text-[12px] leading-relaxed text-muted-light">
              <strong className="font-semibold text-foreground">Timeline:</strong> {details.timeline}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Part2ResultsDashboard({ result, studentName }: Part2ResultsDashboardProps) {
  const { topRoutes, actionReadiness, actionReadinessLevel, tieNote } = result;

  let actionMessage = "";
  if (actionReadiness >= 75) {
    actionMessage = "You are READY to act. Pick your Top Route and start applications/planning now.";
  } else if (actionReadiness >= 55) {
    actionMessage = "You are ALMOST ready. Do 2–3 planning steps this month and then decide.";
  } else {
    actionMessage = "You are in EXPLORATION mode. Focus on simple steps and build a support plan first.";
  }

  return (
    <div className="animate-fade-in space-y-10">
      <div>
        <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]">
          {studentName ? `${studentName.split(" ")[0]}'s ` : "Your "}post-high-school routes
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-muted">
          These routes fit your current situation, preferences, and readiness. Use them to explore your next steps.
        </p>
      </div>

      {/* Action Readiness */}
      <section className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)] sm:p-6">
        <h2 className="mb-3 text-[15px] font-semibold text-foreground">Your Action Readiness</h2>
        <div className="mb-3 flex items-baseline gap-3">
          <span className="text-[2rem] font-bold text-primary">{actionReadiness}</span>
          <span className="text-[14px] font-medium text-muted">{actionReadinessLevel}</span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-border/80">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${actionReadiness}%` }}
          />
        </div>
        <p className="text-[14px] leading-relaxed text-muted-light">{actionMessage}</p>
      </section>

      {tieNote && (
        <div className="rounded-[16px] bg-primary-light px-4 py-3.5 text-[14px] leading-relaxed text-foreground/80">
          {tieNote}
        </div>
      )}

      {/* Top Routes */}
      <section>
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          Top routes for you
        </h2>
        <div className="space-y-3">
          {topRoutes.map((route, i) => (
            <RouteDetailCard key={route.route} route={route} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* All Routes */}
      <section>
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          All route scores
        </h2>
        <div className="overflow-hidden rounded-[20px] bg-card shadow-[var(--shadow)]">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-5 py-3 text-left text-[12px] font-medium text-muted">
                  Route
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
              {result.routeScores.map((r) => (
                <tr
                  key={r.route}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-5 py-3.5 font-medium tracking-tight">{r.route}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                    {r.score}
                  </td>
                  <td className="hidden px-5 py-3.5 text-right text-muted sm:table-cell">
                    {r.fitLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Next Steps Summary */}
      <section className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)] sm:p-6">
        <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-muted uppercase">
          What to do next
        </h2>
        <ul className="space-y-3">
          {[
            "Review your top 3 routes and expand each one to see detailed next steps",
            "Pick 1-2 routes that feel most realistic for your situation right now",
            "Complete at least 2 action steps from your chosen route in the next 2 weeks",
            "Talk to 1 adult (counselor, teacher, family member) about your top choices",
            "Set a check-in date (30 days) to review progress and adjust your plan",
          ].map((item, i) => (
            <li
              key={i}
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
