"use client";

import type { SectionKey } from "@/lib/types";
import { sectionInstructions } from "@/data/instructions";
import { getConfig } from "@/lib/scoring";

interface SectionIntroProps {
  section: SectionKey;
  answeredCount: number;
  onStart: () => void;
}

export default function SectionIntro({
  section,
  answeredCount,
  onStart,
}: SectionIntroProps) {
  const info = sectionInstructions[section];
  const config = getConfig();
  const sectionConfig = config.sections[section];
  const total = sectionConfig.items.length;
  const isResume = answeredCount > 0 && answeredCount < total;

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in text-center">
        <p className="mb-2 text-[14px] font-semibold text-primary">
          {sectionConfig.label}
        </p>
        <h1 className="mb-3 text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          {info.title}
        </h1>
        <p className="mb-10 text-[16px] leading-relaxed text-muted">
          {info.guidelines[0]}
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
