"use client";

import { useEffect, useState } from "react";
import {
  getAuthenticatedUser,
  isAdminUser,
  isSuperAdminUser,
} from "@/lib/auth/guards";
import { appPath, createClient } from "@/lib/supabase/client";

interface AuthGuardOptions {
  admin?: boolean;
  superAdmin?: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        window.location.replace(appPath("/login"));
        return;
      }

      if (options.superAdmin) {
        const allowed = await isSuperAdminUser(supabase, user.id);
        if (!allowed) {
          window.location.replace(appPath("/admin"));
          return;
        }
      } else if (options.admin) {
        const allowed = await isAdminUser(supabase, user.id);
        if (!allowed) {
          window.location.replace(appPath("/"));
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
  }, [options.admin, options.superAdmin]);

  return ready;
}
