"use client";

import { useState } from "react";
import Link from "next/link";
import AssessmentShell from "@/components/AssessmentShell";
import ScaleLegend from "@/components/ScaleLegend";
import StatementCard from "@/components/StatementCard";
import { getPart2Config, getPart2SectionOrder } from "@/lib/part2-scoring";
import { withBasePath } from "@/lib/supabase/client";
import type { Part2AssessmentItem, Part2Responses, Part2SectionKey } from "@/lib/part2-types";

interface Part2SectionFlowProps {
  section: Part2SectionKey;
  items: Part2AssessmentItem[];
  currentIndex: number;
  responses: Part2Responses;
  onAnswer: (itemId: string, rating: number) => Promise<void>;
  onNavigate: (nextSection: Part2SectionKey | null, nextIndex: number) => Promise<void>;
}

export default function Part2SectionFlow({
  section,
  items,
  currentIndex,
  responses,
  onAnswer,
  onNavigate,
}: Part2SectionFlowProps) {
  const config = getPart2Config();
  const sectionInfo = config.sections[section];
  const sectionOrder = getPart2SectionOrder();
  const [saving, setSaving] = useState(false);

  const currentItem = items[currentIndex];
  const answered = items.filter((i) => responses[i.id] != null).length;
  const percent = Math.round((answered / items.length) * 100);
  const isComplete = answered === items.length;
  const currentSectionIndex = sectionOrder.indexOf(section);
  const isLastSection = currentSectionIndex === sectionOrder.length - 1;
  const currentAnswered = responses[currentItem?.id] != null;

  const handleAnswer = async (rating: number) => {
    if (!currentItem || saving) return;
    
    setSaving(true);
    await onAnswer(currentItem.id, rating);
    setSaving(false);

    // Auto-advance to next question
    if (currentIndex < items.length - 1) {
      await onNavigate(section, currentIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      void onNavigate(section, currentIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      void onNavigate(section, currentIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleComplete = () => {
    const nextSectionIndex = currentSectionIndex + 1;
    if (nextSectionIndex < sectionOrder.length) {
      void onNavigate(sectionOrder[nextSectionIndex], 0);
    } else {
      void onNavigate(null, currentIndex);
    }
  };

  if (!currentItem) {
    return (
      <div className="page-shell justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <AssessmentShell
      footer={
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
          {!isComplete ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!currentAnswered || saving || currentIndex >= items.length - 1}
              className="btn-primary"
            >
              {saving ? "Saving…" : currentIndex === items.length - 1 ? "Finish section" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="btn-primary"
            >
              {isLastSection ? "View Results" : "Next Section"}
            </button>
          )}
          <div className="flex w-full items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="cursor-pointer font-medium text-muted transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
            >
              Back
            </button>
            <Link
              href={withBasePath("/part2")}
              className="font-medium text-muted transition-colors hover:text-foreground"
            >
              Part 2 overview
            </Link>
            <span className="tabular-nums text-muted-light">
              {answered}/{items.length}
            </span>
          </div>
        </div>
      }
    >
      <div className="animate-fade-in">
        <p className="mb-4 text-[12px] font-semibold tracking-wide text-primary uppercase">
          {sectionInfo.label}
        </p>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="font-medium text-foreground">
              Question {currentIndex + 1} of {items.length}
            </span>
            <span className="text-muted">{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.max(percent, 1)}%` }}
            />
          </div>
        </div>

        <h1 className="my-7 px-1 text-center text-[22px] font-semibold leading-snug tracking-tight text-foreground sm:my-8 sm:text-[24px]">
          {sectionInfo.subtitle}
        </h1>

        <ScaleLegend />

        <div className="space-y-4">
          <StatementCard
            statement={currentItem.text}
            value={responses[currentItem.id] ?? null}
            onChange={handleAnswer}
          />
        </div>

        {!currentAnswered && (
          <p className="mt-8 text-center text-[13px] text-muted-light">
            Answer to continue
          </p>
        )}

        {isComplete && (
          <p className="mt-6 text-center text-[13px] font-medium text-primary">
            ✓ Section complete — {isLastSection ? "click to view results" : "continue to next section"}
          </p>
        )}
      </div>
    </AssessmentShell>
  );
}
