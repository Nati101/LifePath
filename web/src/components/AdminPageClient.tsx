"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { fetchDashboardData } from "@/lib/admin/fetchDashboardData";
import type { AdminDashboardData } from "@/lib/admin/dashboardTypes";
import { createClient } from "@/lib/supabase/client";

export default function AdminPageClient() {
  const ready = useAuthGuard({ admin: true });
  const [data, setData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const dashboard = await fetchDashboardData(supabase);
      if (!cancelled) setData(dashboard);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready || !data) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <p className="text-[15px] text-muted">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-page-content">
        <AdminDashboard data={data} />
      </div>
    </div>
  );
}
