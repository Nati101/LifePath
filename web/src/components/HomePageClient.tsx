"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import GuestLanding from "@/components/GuestLanding";
import LoggedInHome from "@/components/LoggedInHome";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function HomePageClient() {
  const router = useRouter();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "guest" }
    | {
        status: "authed";
        fullName: string | null;
        sessionStatus: string | null;
        isAdmin: boolean;
        avatarEmoji: string | null;
      }
  >({ status: "loading" });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function syncFromSession(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) setState({ status: "guest" });
        return;
      }

      const [{ data: profile }, { data: assessmentSession }] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, full_name, avatar_emoji")
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("assessment_sessions")
          .select("status")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ]);

      // Redirect admins to admin dashboard
      if (profile?.role === "admin" && !cancelled) {
        router.replace(withBasePath("/admin"));
        return;
      }

      if (!cancelled) {
        setState({
          status: "authed",
          fullName: profile?.full_name ?? null,
          sessionStatus: assessmentSession?.status ?? null,
          isAdmin: profile?.role === "admin",
          avatarEmoji: profile?.avatar_emoji ?? null,
        });
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncFromSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncFromSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (state.status === "loading") {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  if (state.status === "guest") {
    return <GuestLanding />;
  }

  return (
    <LoggedInHome
      fullName={state.fullName}
      sessionStatus={state.sessionStatus}
      isAdmin={state.isAdmin}
      avatarEmoji={state.avatarEmoji}
    />
  );
}
