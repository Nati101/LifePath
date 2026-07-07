"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      if (!cancelled) {
        router.replace(withBasePath("/"));
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
