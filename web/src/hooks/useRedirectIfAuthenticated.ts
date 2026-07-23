"use client";

import { useEffect } from "react";
import { getPostAuthHomePath } from "@/lib/auth/guards";
import { appPath, createClient } from "@/lib/supabase/client";

/** If already signed in, send students to `/` and admins to `/admin`. */
export function useRedirectIfAuthenticated() {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function goHome() {
      const path = await getPostAuthHomePath(supabase);
      if (!cancelled && path !== "/login") {
        window.location.replace(appPath(path));
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void goHome();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void goHome();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
}
