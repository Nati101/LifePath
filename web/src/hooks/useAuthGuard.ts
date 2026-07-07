"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth/guards";
import { createClient, withBasePath } from "@/lib/supabase/client";

interface AuthGuardOptions {
  admin?: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      if (options.admin) {
        const allowed = await isAdminUser(supabase, user.id);
        if (!allowed) {
          router.replace(withBasePath("/"));
          return;
        }
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [options.admin, router]);

  return ready;
}
