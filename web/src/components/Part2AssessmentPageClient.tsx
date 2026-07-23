"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import {
  getPart2SectionItems,
  getPart2SectionCompletion,
  getPart2SectionOrder,
} from "@/lib/part2-scoring";
import type { Part2SectionKey, Part2Responses } from "@/lib/part2-types";

function findFirstIncompleteIndex(
  items: { id: string }[],
  responses: Part2Responses,
) {
  const idx = items.findIndex((item) => responses[item.id] == null);
  return idx === -1 ? Math.max(items.length - 1, 0) : idx;
}

export default function Part2AssessmentPageClient() {
  const ready = useAuthGuard({ admin: false });
  const params = useParams();
  const sectionParam = params?.section as string | undefined;

  const [loading, setLoading] = useState(true);
  const [part1Incomplete, setPart1Incomplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<Part2SectionKey>("school_setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Part2Responses>({});
  const [allSectionsComplete, setAllSectionsComplete] = useState(false);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const part1Complete = await hasPart1Completed(supabase, user.id);
      if (!part1Complete) {
        setPart1Incomplete(true);
        setLoading(false);
        return;
      }

      const session = await getOrCreatePart2Session(supabase, user.id);
      const loadedResponses = await loadPart2Responses(supabase, session.id);

      if (cancelled) return;

      const sectionOrder = getPart2SectionOrder();
      let targetSection: Part2SectionKey = session.current_section;

      if (sectionParam && sectionOrder.includes(sectionParam as Part2SectionKey)) {
        targetSection = sectionParam as Part2SectionKey;
      }

      const sectionItems = getPart2SectionItems(targetSection);
      const safeIndex = findFirstIncompleteIndex(sectionItems, loadedResponses);
      const completion = getPart2SectionCompletion(loadedResponses);

      setSessionId(session.id);
      setUserId(user.id);
      setResponses(loadedResponses);
      setCurrentSection(targetSection);
      setCurrentIndex(safeIndex);
      setAllSectionsComplete(Object.values(completion).every((c) => c >= 1));
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

    const completion = getPart2SectionCompletion(newResponses);
    setAllSectionsComplete(Object.values(completion).every((c) => c >= 1));

    try {
      await savePart2Response(supabase, {
        sessionId,
        userId,
        itemId,
        section: currentSection,
        rating,
      });
      await updatePart2Session(supabase, {
        sessionId,
        currentSection,
        currentIndex,
      });
    } catch (error) {
      console.error("Failed to save Part 2 response:", error);
    }
  };

  const handleIndexChange = async (nextIndex: number) => {
    if (!sessionId) return;

    setCurrentIndex(nextIndex);

    try {
      const supabase = createClient();
      await updatePart2Session(supabase, {
        sessionId,
        currentSection,
        currentIndex: nextIndex,
      });
    } catch (error) {
      console.error("Failed to update Part 2 session:", error);
    }
  };

  const handleSectionFinished = async () => {
    if (!sessionId || !userId) return false;

    const supabase = createClient();
    const completion = getPart2SectionCompletion(responses);
    const allComplete = Object.values(completion).every((c) => c >= 1);
    setAllSectionsComplete(allComplete);

    try {
      if (allComplete) {
        await savePart2Results(supabase, { sessionId, userId, responses });
        await updatePart2Session(supabase, {
          sessionId,
          currentSection,
          currentIndex,
          status: "completed",
        });
      } else {
        const sectionOrder = getPart2SectionOrder();
        const currentSectionIndex = sectionOrder.indexOf(currentSection);
        const nextSection =
          currentSectionIndex < sectionOrder.length - 1
            ? sectionOrder[currentSectionIndex + 1]
            : currentSection;

        await updatePart2Session(supabase, {
          sessionId,
          currentSection: nextSection,
          currentIndex: 0,
        });
      }
      return true;
    } catch (error) {
      console.error("Failed to finish Part 2 section:", error);
      return false;
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
            My Path After High School requires you to complete Part 1 (LifePath Career Assessment)
            first.
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
      key={currentSection}
      section={currentSection}
      items={items}
      currentIndex={currentIndex}
      responses={responses}
      allSectionsComplete={allSectionsComplete}
      onAnswer={handleAnswer}
      onIndexChange={handleIndexChange}
      onSectionFinished={handleSectionFinished}
    />
  );
}
