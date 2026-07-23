"use client";

import { useEffect } from "react";
import { appPath, createClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  useEffect(() => {
    let cancelled = false;

    async function signOut() {
      const supabase = createClient();
      await supabase.auth.signOut();

      if (!cancelled) {
        window.location.replace(appPath("/"));
      }
    }

    void signOut();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell centered">
      <p className="text-[15px] text-muted">Signing you out…</p>
    </div>
  );
}
