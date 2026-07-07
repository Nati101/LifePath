"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function signOut() {
      const supabase = createClient();
      await supabase.auth.signOut();

      if (!cancelled) {
        router.replace(withBasePath("/"));
      }
    }

    void signOut();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="page-shell centered">
      <p className="text-[15px] text-muted">Signing you out…</p>
    </div>
  );
}
