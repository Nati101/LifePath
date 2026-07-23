"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/assessment";
  }
  return raw;
}

export default function AuthCallbackPage() {
  const router = useRouter();

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
          router.replace(withBasePath("/login"));
          return;
        }
      }

      if (!cancelled) {
        router.replace(withBasePath(next));
      }
    }

    void finishSignIn();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="page-shell centered">
      <p className="text-[15px] text-muted">Signing you in…</p>
    </div>
  );
}
