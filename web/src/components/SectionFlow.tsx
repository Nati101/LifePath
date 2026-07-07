"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AssessmentShell from "@/components/AssessmentShell";
import ProgressBar from "@/components/ProgressBar";
import ScaleLegend from "@/components/ScaleLegend";
import StatementCard from "@/components/StatementCard";
import SectionIntro from "@/components/SectionIntro";
import SectionComplete from "@/components/SectionComplete";
import LoadingResults from "@/components/LoadingResults";
import {
  ensureProfile,
  getOrCreateSession,
  loadResponses,
  saveResponse as persistResponse,
  saveResults,
} from "@/lib/assessment/persistence";
import {
  getConfig,
  getSectionCompletion,
  getSectionItems,
} from "@/lib/scoring";
import { QUESTIONS_PER_STEP } from "@/lib/scale";
import { sectionLabels } from "@/data/instructions";
import { createClient, withBasePath } from "@/lib/supabase/client";
import type { AssessmentItem, Responses, SectionKey } from "@/lib/types";

type Phase = "intro" | "questions" | "complete";

interface SectionFlowProps {
  section: SectionKey;
}

function getTotalSteps(itemCount: number) {
  return Math.ceil(itemCount / QUESTIONS_PER_STEP);
}

function getStepItems(items: AssessmentItem[], step: number) {
  const start = step * QUESTIONS_PER_STEP;
  return items.slice(start, start + QUESTIONS_PER_STEP);
}

function findFirstIncompleteStep(items: AssessmentItem[], responses: Responses) {
  const totalSteps = getTotalSteps(items.length);
  for (let s = 0; s < totalSteps; s++) {
    const stepItems = getStepItems(items, s);
    if (stepItems.some((item) => responses[item.id] == null)) return s;
  }
  return totalSteps - 1;
}

export default function SectionFlow({ section }: SectionFlowProps) {
  const config = getConfig();
  const items = useMemo(() => getSectionItems(section), [section]);
  const sectionInfo = config.sections[section];
  const totalSteps = getTotalSteps(items.length);

  const [phase, setPhase] = useState<Phase>("intro");
  const [responses, setResponses] = useState<Responses>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [allSectionsComplete, setAllSectionsComplete] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const stepItems = getStepItems(items, currentStep);
  const sectionAnswered = items.filter((i) => responses[i.id] != null).length;
  const stepComplete = stepItems.every((i) => responses[i.id] != null);
  const percent = Math.round((sectionAnswered / items.length) * 100);
  const isLastStep = currentStep === totalSteps - 1;

  const loadSession = useCallback(async () => {
    setSaveError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setSaveError("Please sign in to save your progress.");
      return;
    }

    try {
      await ensureProfile(supabase, user);
      const session = await getOrCreateSession(supabase, user.id, section);
      setSessionId(session.id);
      setUserId(user.id);

      const map = await loadResponses(supabase, session.id);
      setResponses(map);

      const sectionDone = items.every((i) => map[i.id] != null);
      if (sectionDone) {
        setPhase("complete");
      } else {
        setCurrentStep(findFirstIncompleteStep(items, map));
      }

      const completion = getSectionCompletion(map);
      setAllSectionsComplete(Object.values(completion).every((c) => c >= 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load session";
      console.error(message);
      setSaveError(message);
    } finally {
      setLoading(false);
    }
  }, [items, section]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleSaveResponse = async (itemId: string, rating: number) => {
    const next = { ...responses, [itemId]: rating };
    setResponses(next);
    setSaveError(null);

    if (!sessionId || !userId) {
      setSaveError("Session not ready — refresh the page and try again.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await persistResponse(supabase, {
        sessionId,
        userId,
        itemId,
        section,
        rating,
      });

      await supabase
        .from("assessment_sessions")
        .update({ current_section: section })
        .eq("id", sessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save answer";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (!stepComplete || !sessionId || !userId) return;

    if (isLastStep) {
      setSaving(true);
      setSaveError(null);
      try {
        const supabase = createClient();
        const allResponses = await loadResponses(supabase, sessionId);
        const completion = getSectionCompletion(allResponses);

        if (Object.values(completion).every((c) => c >= 1)) {
          await saveResults(supabase, {
            sessionId,
            userId,
            responses: allResponses,
          });
          setAllSectionsComplete(true);
        }

        setResponses(allResponses);
        setPhase("complete");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to finish section";
        setSaveError(message);
      } finally {
        setSaving(false);
      }
      return;
    }

    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) return <LoadingResults message="Loading section..." />;

  if (phase === "intro") {
    return (
      <>
        {saveError && (
          <p className="mx-auto mt-4 max-w-md px-5 text-center text-[13px] text-danger">
            {saveError}
          </p>
        )}
        <SectionIntro
          section={section}
          answeredCount={sectionAnswered}
          onStart={() => {
            if (!sessionId) {
              setSaveError("Could not start — session not loaded. Refresh and try again.");
              return;
            }
            setPhase("questions");
          }}
        />
      </>
    );
  }

  if (phase === "complete") {
    return (
      <>
        {saveError && (
          <p className="mx-auto mt-4 max-w-md px-5 text-center text-[13px] text-danger">
            {saveError}
          </p>
        )}
        <SectionComplete
          section={section}
          allSectionsComplete={allSectionsComplete}
        />
      </>
    );
  }

  const prompt =
    section === "conditions"
      ? "Choose what you would want on most work days."
      : "Choose how accurately each statement reflects you.";

  return (
    <AssessmentShell
      footer={
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
          {saveError && (
            <p className="w-full text-center text-[13px] text-danger">{saveError}</p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!stepComplete || saving}
            className="btn-primary"
          >
            {saving ? "Saving…" : isLastStep ? "Finish section" : "Continue"}
          </button>
          <div className="flex w-full items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="cursor-pointer font-medium text-muted transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
            >
              Back
            </button>
            <Link
              href={withBasePath("/assessment")}
              className="font-medium text-muted transition-colors hover:text-foreground"
            >
              All sections
            </Link>
            <span className="tabular-nums text-muted-light">
              {sectionAnswered}/{items.length}
            </span>
          </div>
        </div>
      }
    >
      <div className="animate-fade-in">
        <p className="mb-4 text-[12px] font-semibold tracking-wide text-primary uppercase">
          {sectionLabels[section]}
        </p>

        <ProgressBar
          percent={percent}
          step={currentStep + 1}
          totalSteps={totalSteps}
        />

        <h1 className="my-7 px-1 text-center text-[22px] font-semibold leading-snug tracking-tight text-foreground sm:my-8 sm:text-[24px]">
          {prompt}
        </h1>

        <ScaleLegend />

        <div className="space-y-4">
          {stepItems.map((item) => (
            <StatementCard
              key={item.id}
              statement={item.text}
              value={responses[item.id] ?? null}
              onChange={(rating) => handleSaveResponse(item.id, rating)}
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
