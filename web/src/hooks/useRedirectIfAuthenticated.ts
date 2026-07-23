"use client";

import { useEffect } from "react";
import { appPath, createClient } from "@/lib/supabase/client";

export function useRedirectIfAuthenticated(redirectTo = "/") {
  useEffect(() => {
    const supabase = createClient();

    const go = () => {
      window.location.replace(appPath(redirectTo));
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    return () => subscription.unsubscribe();
  }, [redirectTo]);
}
