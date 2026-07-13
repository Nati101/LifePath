"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Part2SectionFlow from "@/components/Part2SectionFlow";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createClient, withBasePath } from "@/lib/supabase/client";
import {
  getOrCreatePart2Session,
  loadPart2Responses,
  savePart2Response,
  updatePart2Session,
  savePart2Results,
  hasPart1Completed,
} from "@/lib/part2-persistence";
import { getPart2SectionItems, getPart2SectionCompletion, getPart2SectionOrder } from "@/lib/part2-scoring";
import type { Part2SectionKey, Part2Responses } from "@/lib/part2-types";

export default function Part2AssessmentPageClient() {
  const ready = useAuthGuard({ admin: false });
  const router = useRouter();
  const params = useParams();
  const sectionParam = params?.section as string | undefined;

  const [loading, setLoading] = useState(true);
  const [part1Incomplete, setPart1Incomplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<Part2SectionKey>("school_setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Part2Responses>({});

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Check Part 1 completion
      const part1Complete = await hasPart1Completed(supabase, user.id);
      if (!part1Complete) {
        setPart1Incomplete(true);
        setLoading(false);
        return;
      }

      const session = await getOrCreatePart2Session(supabase, user.id);
      const loadedResponses = await loadPart2Responses(supabase, session.id);

      if (cancelled) return;

      setSessionId(session.id);
      setUserId(user.id);
      setResponses(loadedResponses);

      // Determine section from URL or session
      let targetSection: Part2SectionKey = session.current_section;
      const sectionOrder = getPart2SectionOrder();

      if (sectionParam && sectionOrder.includes(sectionParam as Part2SectionKey)) {
        targetSection = sectionParam as Part2SectionKey;
      }

      setCurrentSection(targetSection);
      setCurrentIndex(session.current_index);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, sectionParam]);

  const handleAnswer = async (itemId: string, rating: number) => {
    if (!sessionId || !userId) return;

    const supabase = createClient();
    const newResponses = { ...responses, [itemId]: rating };
    setResponses(newResponses);

    try {
      await savePart2Response(supabase, {
        sessionId,
        userId,
        itemId,
        section: currentSection,
        rating,
      });
    } catch (error) {
      console.error("Failed to save Part 2 response:", error);
    }
  };

  const handleNavigate = async (nextSection: Part2SectionKey | null, nextIndex: number) => {
    if (!sessionId) return;

    const supabase = createClient();
    const sectionOrder = getPart2SectionOrder();
    const currentSectionIndex = sectionOrder.indexOf(currentSection);

    if (nextSection === null) {
      // Completed all sections
      const completion = getPart2SectionCompletion(responses);
      const allComplete = Object.values(completion).every((c) => c >= 1);

      if (allComplete) {
        try {
          await savePart2Results(supabase, { sessionId, userId: userId!, responses });
          await updatePart2Session(supabase, {
            sessionId,
            currentSection,
            currentIndex: nextIndex,
            status: "completed",
          });
          router.push(withBasePath("/part2/results"));
        } catch (error) {
          console.error("Failed to save Part 2 results:", error);
        }
      }
      return;
    }

    // Update session state
    try {
      await updatePart2Session(supabase, {
        sessionId,
        currentSection: nextSection,
        currentIndex: nextIndex,
      });
      
      setCurrentSection(nextSection);
      setCurrentIndex(nextIndex);
      router.push(withBasePath(`/part2/assessment/${nextSection}`));
    } catch (error) {
      console.error("Failed to update Part 2 session:", error);
    }
  };

  if (!ready || loading) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  if (part1Incomplete) {
    return (
      <div className="page-shell centered">
        <div className="page-content text-center">
          <h1 className="mb-2 text-[1.75rem] font-semibold tracking-tight">
            Complete Part 1 First
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-muted">
            Part 2 (My Path After High School) requires you to complete Part 1 (LifePath Career Assessment) first.
          </p>
          <Link href={withBasePath("/assessment")} className="btn-primary">
            Go to Part 1
          </Link>
        </div>
      </div>
    );
  }

  const items = getPart2SectionItems(currentSection);

  return (
    <Part2SectionFlow
      section={currentSection}
      items={items}
      currentIndex={currentIndex}
      responses={responses}
      onAnswer={handleAnswer}
      onNavigate={handleNavigate}
    />
  );
}
