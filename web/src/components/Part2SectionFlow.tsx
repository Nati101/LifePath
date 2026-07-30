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
import { QUESTIONS_PER_STEP } from "@/lib/scale";
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

const sectionPageDescriptions: Record<Part2SectionKey, string> = {
  school_setup:
    "These questions look at your courses, grades, and school habits right now.",
  training_style:
    "These questions ask what kind and length of training feels like a fit for you.",
  life_factors:
    "These questions cover real-life reasons that shape which route makes sense for you.",
  exploration:
    "These questions check what you've already explored and what you're ready to do next.",
};

function getTotalSteps(itemCount: number) {
  return Math.ceil(itemCount / QUESTIONS_PER_STEP);
}

function getStepItems(items: Part2AssessmentItem[], step: number) {
  const start = step * QUESTIONS_PER_STEP;
  return items.slice(start, start + QUESTIONS_PER_STEP);
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

  const totalSteps = getTotalSteps(items.length);
  const currentStep = Math.min(
    Math.floor(currentIndex / QUESTIONS_PER_STEP),
    Math.max(totalSteps - 1, 0),
  );
  const stepItems = getStepItems(items, currentStep);
  const answered = items.filter((i) => responses[i.id] != null).length;
  const percent = Math.round((answered / items.length) * 100);
  const isComplete = answered === items.length;
  const stepComplete = stepItems.every((i) => responses[i.id] != null);
  const isLastStep = currentStep >= totalSteps - 1;
  const currentSectionIndex = sectionOrder.indexOf(section);
  const prompt = "Choose how accurately each statement reflects you.";

  const handleAnswer = async (itemId: string, rating: number) => {
    if (saving) return;
    setSaving(true);
    await onAnswer(itemId, rating);
    setSaving(false);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      void onIndexChange((currentStep - 1) * QUESTIONS_PER_STEP);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleContinue = async () => {
    if (!stepComplete || saving || finishing) return;

    if (isLastStep) {
      if (!isComplete) return;
      setFinishing(true);
      try {
        await onSectionFinished();
        setPhase("complete");
      } finally {
        setFinishing(false);
      }
      return;
    }

    await onIndexChange((currentStep + 1) * QUESTIONS_PER_STEP);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (stepItems.length === 0) {
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
            onClick={() => void handleContinue()}
            disabled={saving || finishing || !stepComplete}
            className="btn-primary"
          >
            {saving || finishing
              ? "Saving…"
              : isLastStep
                ? "Finish section"
                : "Continue"}
          </button>
          <div className="flex w-full items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
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

        <ProgressBar
          percent={percent}
          step={currentStep + 1}
          totalSteps={totalSteps}
        />

        <h1 className="my-7 px-1 text-center text-[22px] font-semibold leading-snug tracking-tight text-foreground sm:my-8 sm:text-[24px]">
          {prompt}
        </h1>

        <ScaleLegend description={sectionPageDescriptions[section]} />

        <div className="space-y-4">
          {stepItems.map((item) => (
            <StatementCard
              key={item.id}
              statement={item.text}
              value={responses[item.id] ?? null}
              onChange={(rating) => void handleAnswer(item.id, rating)}
            />
          ))}
        </div>

        {!stepComplete && (
          <p className="mt-8 text-center text-[13px] text-muted-light">
            Answer all {stepItems.length} statements to continue
          </p>
        )}
      </div>
    </AssessmentShell>
  );
}
