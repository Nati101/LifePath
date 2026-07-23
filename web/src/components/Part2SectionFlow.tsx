"use client";

import { useState } from "react";
import Link from "next/link";
import AssessmentShell from "@/components/AssessmentShell";
import Part2SectionComplete from "@/components/Part2SectionComplete";
import Part2SectionIntro from "@/components/Part2SectionIntro";
import ProgressBar from "@/components/ProgressBar";
import ScaleLegend from "@/components/ScaleLegend";
import StatementCard from "@/components/StatementCard";
import {
  getPart2Config,
  getPart2SectionCompletion,
  getPart2SectionOrder,
} from "@/lib/part2-scoring";
import { withBasePath } from "@/lib/supabase/client";
import type { Part2AssessmentItem, Part2Responses, Part2SectionKey } from "@/lib/part2-types";

type Phase = "intro" | "questions" | "complete";

interface Part2SectionFlowProps {
  section: Part2SectionKey;
  items: Part2AssessmentItem[];
  currentIndex: number;
  responses: Part2Responses;
  allSectionsComplete: boolean;
  onAnswer: (itemId: string, rating: number) => Promise<void>;
  onIndexChange: (index: number) => Promise<void>;
  onSectionFinished: () => Promise<boolean>;
}

export default function Part2SectionFlow({
  section,
  items,
  currentIndex,
  responses,
  allSectionsComplete,
  onAnswer,
  onIndexChange,
  onSectionFinished,
}: Part2SectionFlowProps) {
  const config = getPart2Config();
  const sectionInfo = config.sections[section];
  const sectionOrder = getPart2SectionOrder();
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [phase, setPhase] = useState<Phase>(() =>
    items.every((i) => responses[i.id] != null) ? "complete" : "intro",
  );

  const currentItem = items[currentIndex];
  const answered = items.filter((i) => responses[i.id] != null).length;
  const percent = Math.round((answered / items.length) * 100);
  const isComplete = answered === items.length;
  const currentSectionIndex = sectionOrder.indexOf(section);
  const currentAnswered = responses[currentItem?.id] != null;
  const isLastQuestion = currentIndex >= items.length - 1;
  const prompt = "Choose how accurately each statement reflects you.";

  const handleAnswer = async (rating: number) => {
    if (!currentItem || saving) return;

    setSaving(true);
    await onAnswer(currentItem.id, rating);
    setSaving(false);

    if (currentIndex < items.length - 1) {
      await onIndexChange(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      void onIndexChange(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      void onIndexChange(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinishSection = async () => {
    if (finishing || !isComplete) return;
    setFinishing(true);
    try {
      await onSectionFinished();
      setPhase("complete");
    } finally {
      setFinishing(false);
    }
  };

  if (phase === "intro") {
    return (
      <Part2SectionIntro
        section={section}
        answeredCount={answered}
        total={items.length}
        onStart={() => setPhase("questions")}
      />
    );
  }

  if (phase === "complete") {
    const completion = getPart2SectionCompletion(responses);
    const allDone = Object.values(completion).every((c) => c >= 1);
    const nextIncomplete = sectionOrder.find(
      (key, index) => index > currentSectionIndex && (completion[key] ?? 0) < 1,
    );
    const fallbackIncomplete = sectionOrder.find((key) => (completion[key] ?? 0) < 1);
    const nextSection = nextIncomplete ?? fallbackIncomplete ?? null;

    return (
      <Part2SectionComplete
        section={section}
        allSectionsComplete={allDone || allSectionsComplete}
        nextSectionHref={nextSection ? `/part2/assessment/${nextSection}` : null}
        onChangeAnswers={() => {
          void onIndexChange(0);
          setPhase("questions");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

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
          <button
            type="button"
            onClick={isLastQuestion ? () => void handleFinishSection() : handleNext}
            disabled={
              saving ||
              finishing ||
              !currentAnswered ||
              (isLastQuestion && !isComplete)
            }
            className="btn-primary"
          >
            {saving || finishing
              ? "Saving…"
              : isLastQuestion
                ? "Finish section"
                : "Continue"}
          </button>
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
              href={withBasePath("/part2/assessment")}
              className="font-medium text-muted transition-colors hover:text-foreground"
            >
              All sections
            </Link>
            <span className="tabular-nums text-muted-light">
              {answered}/{items.length}
            </span>
          </div>
        </div>
      }
    >
      <div className="animate-fade-in">
        <p className="mb-1 text-[12px] font-semibold tracking-wide text-primary uppercase">
          {sectionInfo.label}
        </p>
        <p className="mb-4 text-[12px] text-muted">
          Section {currentSectionIndex + 1} of {sectionOrder.length}
        </p>

        <ProgressBar percent={percent} step={currentIndex + 1} totalSteps={items.length} />

        <h1 className="my-7 px-1 text-center text-[22px] font-semibold leading-snug tracking-tight text-foreground sm:my-8 sm:text-[24px]">
          {prompt}
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
          <p className="mt-8 text-center text-[13px] text-muted-light">Answer to continue</p>
        )}
      </div>
    </AssessmentShell>
  );
}
