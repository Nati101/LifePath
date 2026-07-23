"use client";

import { useCallback, useEffect, useState } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { fetchDashboardData } from "@/lib/admin/fetchDashboardData";
import type { AdminDashboardData } from "@/lib/admin/dashboardTypes";
import { createClient } from "@/lib/supabase/client";

export default function AdminPageClient() {
  const ready = useAuthGuard({ admin: true });
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      const supabase = createClient();
      const result = await fetchDashboardData(supabase);
      if (cancelled) return;
      if (result.error) {
        setLoadError(result.error);
        setData((prev) => prev ?? result.data);
      } else {
        setData(result.data);
        setLoadError("");
      }
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, reloadToken]);

  if (!ready || (loading && !data)) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <p className="text-[15px] text-muted">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (loadError && !data?.students.length) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <div className="surface-card p-5 sm:p-6">
            <p className="text-[14px] text-danger">{loadError}</p>
            <button type="button" className="btn-secondary mt-4" onClick={retry}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
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
        {loadError && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-danger/30 bg-card px-4 py-3">
            <p className="text-[14px] text-danger">{loadError}</p>
            <button type="button" className="btn-secondary-sm" onClick={retry}>
              Retry
            </button>
          </div>
        )}
        <AdminDashboard data={data} />
      </div>
    </div>
  );
}
