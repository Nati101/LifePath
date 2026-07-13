"use client";

import { useState } from "react";
import Link from "next/link";
import AssessmentShell from "@/components/AssessmentShell";
import ScaleGrid from "@/components/ScaleGrid";
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

  const handleAnswer = async (rating: number) => {
    if (!currentItem || saving) return;
    
    setSaving(true);
    await onAnswer(currentItem.id, rating);
    setSaving(false);

    // Auto-advance to next question
    if (currentIndex < items.length - 1) {
      await onNavigate(section, currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      void onNavigate(section, currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      void onNavigate(section, currentIndex + 1);
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
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <AssessmentShell>
      <div className="assessment-container">
        {/* Header */}
        <div className="assessment-header">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={withBasePath("/part2")}
              className="text-[14px] font-medium text-primary hover:underline"
            >
              ← Back to Part 2
            </Link>
            <span className="text-[13px] text-muted">
              Part 2: My Path After High School
            </span>
          </div>

          <h1 className="mb-2 text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
            {sectionInfo.label}
          </h1>
          <p className="mb-6 text-[15px] text-muted">{sectionInfo.subtitle}</p>

          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span className="font-medium text-foreground">
                Question {currentIndex + 1} of {items.length}
              </span>
              <span className="text-muted">
                {answered} answered ({percent}%)
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.max(percent, 1)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="question-card">
          <p className="question-text">{currentItem.text}</p>

          <div className="mt-8">
            <ScaleGrid
              mode="select"
              value={responses[currentItem.id] ?? null}
              onChange={handleAnswer}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="assessment-footer">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || saving}
            className="btn-secondary"
          >
            Previous
          </button>

          {!isComplete ? (
            <button
              onClick={handleNext}
              disabled={currentIndex >= items.length - 1 || saving}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="btn-primary"
            >
              {isLastSection ? "View Results" : "Next Section"}
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {isComplete && (
          <div className="mt-4 text-center text-[13px] text-primary">
            ✓ Section complete
          </div>
        )}
      </div>
    </AssessmentShell>
  );
}
