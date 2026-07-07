"use client";

import { useEffect, useState } from "react";
import GuestLanding from "@/components/GuestLanding";
import LoggedInHome from "@/components/LoggedInHome";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/client";

export default function HomePageClient() {
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
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        if (!cancelled) setState({ status: "guest" });
        return;
      }

      const [{ data: profile }, { data: session }] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, full_name, avatar_emoji")
          .eq("id", user.id)
          .single(),
        supabase
          .from("assessment_sessions")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        setState({
          status: "authed",
          fullName: profile?.full_name ?? null,
          sessionStatus: session?.status ?? null,
          isAdmin: profile?.role === "admin",
          avatarEmoji: profile?.avatar_emoji ?? null,
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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
