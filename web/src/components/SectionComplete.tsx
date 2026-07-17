"use client";

import Link from "next/link";
import { sectionLabels } from "@/data/instructions";
import { withBasePath } from "@/lib/supabase/client";
import type { SectionKey } from "@/lib/types";

interface SectionCompleteProps {
  section: SectionKey;
  allSectionsComplete: boolean;
  onChangeAnswers?: () => void;
}

export default function SectionComplete({
  section,
  allSectionsComplete,
  onChangeAnswers,
}: SectionCompleteProps) {
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
        <h2 className="mb-3 text-[28px] font-semibold tracking-tight text-foreground">
          {sectionLabels[section]}
        </h2>
        <p className="mx-auto mb-10 max-w-sm text-[16px] leading-relaxed text-muted">
          {allSectionsComplete
            ? "All nine career path sections are done. Your results are ready to view."
            : "Nice work. Head back to choose your next section when you're ready."}
        </p>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <Link
            href={withBasePath(allSectionsComplete ? "/results" : "/assessment")}
            className="btn-primary"
          >
            {allSectionsComplete ? "View results" : "Back to sections"}
          </Link>
          {onChangeAnswers && (
            <button
              type="button"
              onClick={onChangeAnswers}
              className="btn-secondary"
            >
              Change answers
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
