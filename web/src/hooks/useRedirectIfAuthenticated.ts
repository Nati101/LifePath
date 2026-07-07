"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";

export function useRedirectIfAuthenticated(redirectTo = "/") {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(withBasePath(redirectTo));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace(withBasePath(redirectTo));
      }
    });

    return () => subscription.unsubscribe();
  }, [redirectTo, router]);
}
