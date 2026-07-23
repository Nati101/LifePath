"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createClient, withBasePath } from "@/lib/supabase/client";
import { getPart2Session } from "@/lib/part2-persistence";
import { getPart2SectionOrder } from "@/lib/part2-scoring";
import type { Part2SectionKey } from "@/lib/part2-types";

export default function Part2AssessmentResumeClient() {
  const ready = useAuthGuard({ admin: false });
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function resume() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const session = await getPart2Session(supabase, user.id);
      const sectionOrder = getPart2SectionOrder();
      const saved = session?.current_section;
      const section: Part2SectionKey =
        saved && sectionOrder.includes(saved) ? saved : "school_setup";

      if (!cancelled) {
        router.replace(withBasePath(`/part2/assessment/${section}`));
      }
    }

    void resume();

    return () => {
      cancelled = true;
    };
  }, [ready, router]);

  return (
    <div className="page-shell centered">
      <p className="text-[15px] text-muted">Loading…</p>
    </div>
  );
}
