"use client";

import Link from "next/link";
import { getPart2Config } from "@/lib/part2-scoring";
import { withBasePath } from "@/lib/supabase/client";
import type { Part2SectionKey } from "@/lib/part2-types";

interface Part2SectionCompleteProps {
  section: Part2SectionKey;
  allSectionsComplete: boolean;
  nextSectionHref?: string | null;
  onChangeAnswers?: () => void;
}

export default function Part2SectionComplete({
  section,
  allSectionsComplete,
  nextSectionHref,
  onChangeAnswers,
}: Part2SectionCompleteProps) {
  const label = getPart2Config().sections[section].label;
  const primaryHref = allSectionsComplete
    ? withBasePath("/part2/results")
    : withBasePath(nextSectionHref ?? "/part2/assessment");

  const primaryLabel = allSectionsComplete ? "View results" : "Next section";

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mb-2 text-[14px] font-semibold text-primary">Section complete</p>
        <h2 className="mb-3 text-[28px] font-semibold tracking-tight text-foreground">{label}</h2>
        <p className="mx-auto mb-10 max-w-sm text-[16px] leading-relaxed text-muted">
          {allSectionsComplete
            ? "All four My Path sections are done. Your route recommendations are ready to view."
            : "Nice work. Continue to the next My Path section."}
        </p>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <Link href={primaryHref} className="btn-primary">
            {primaryLabel}
          </Link>
          {!allSectionsComplete && (
            <Link
              href={withBasePath("/part2/assessment")}
              className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Back to all sections
            </Link>
          )}
          {onChangeAnswers && (
            <button type="button" onClick={onChangeAnswers} className="btn-secondary">
              Change answers
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
