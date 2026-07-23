"use client";

import { getPart2Config } from "@/lib/part2-scoring";
import type { Part2SectionKey } from "@/lib/part2-types";

interface Part2SectionIntroProps {
  section: Part2SectionKey;
  answeredCount: number;
  total: number;
  onStart: () => void;
}

export default function Part2SectionIntro({
  section,
  answeredCount,
  total,
  onStart,
}: Part2SectionIntroProps) {
  const sectionConfig = getPart2Config().sections[section];
  const isResume = answeredCount > 0 && answeredCount < total;

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in text-center">
        <p className="mb-2 text-[14px] font-semibold text-primary">{sectionConfig.label}</p>
        <h1 className="mb-3 text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          {sectionConfig.subtitle}
        </h1>
        <p className="mb-10 text-[16px] leading-relaxed text-muted">
          Answer honestly — there are no right or wrong answers. Your progress saves automatically.
        </p>

        {isResume && (
          <p className="mb-6 text-[14px] text-muted">
            {answeredCount} of {total} answered
          </p>
        )}

        <button type="button" onClick={onStart} className="btn-primary">
          {isResume ? "Continue" : "Start"}
        </button>
      </div>
    </div>
  );
}
