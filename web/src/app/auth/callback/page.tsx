"use client";

import { useEffect } from "react";
import { getPostAuthHomePath } from "@/lib/auth/guards";
import { appPath, createClient } from "@/lib/supabase/client";

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

export default function AuthCallbackPage() {
  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = safeNextPath(url.searchParams.get("next"));

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          window.location.replace(appPath("/login"));
          return;
        }
      }

      if (!cancelled) {
        const destination = next ?? (await getPostAuthHomePath(supabase));
        window.location.replace(appPath(destination));
      }
    }

    void finishSignIn();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell centered">
      <p className="text-[15px] text-muted">Signing you in…</p>
    </div>
  );
}
