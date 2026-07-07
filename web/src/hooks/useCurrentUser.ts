"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUser {
  id: string;
  role: string | null;
  fullName: string | null;
  avatarEmoji: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function syncFromSession(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_emoji")
        .eq("id", session.user.id)
        .single();

      if (!cancelled) {
        setUser({
          id: session.user.id,
          role: profile?.role ?? null,
          fullName: profile?.full_name ?? null,
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
  }, []);

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user != null,
  };
}
