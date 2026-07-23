"use client";

import Link from "next/link";
import ManageUsers from "@/components/admin/ManageUsers";
import ManageSchools from "@/components/admin/ManageSchools";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { withBasePath } from "@/lib/supabase/client";
import { useState } from "react";

type Tab = "users" | "schools";

export default function SuperAdminPageClient() {
  const ready = useAuthGuard({ superAdmin: true });
  const [activeTab, setActiveTab] = useState<Tab>("users");

  if (!ready) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <p className="text-[15px] text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-page-content">
        <div className="admin-page">
          <div className="admin-page__header">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="admin-page__title">Super Admin Management</h1>
                <p className="admin-page__subtitle">
                  Manage advisors, schools, and user accounts
                </p>
              </div>
              <Link
                href={withBasePath("/admin")}
                className="text-[14px] font-medium text-primary hover:underline"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="mb-6 flex gap-2 border-b border-border" role="tablist" aria-label="Management sections">
            <button
              type="button"
              role="tab"
              id="tab-users"
              aria-selected={activeTab === "users"}
              aria-controls="panel-users"
              tabIndex={activeTab === "users" ? 0 : -1}
              onClick={() => setActiveTab("users")}
              className={`px-4 py-3 text-[14px] font-medium transition-colors ${
                activeTab === "users"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Users & Advisors
            </button>
            <button
              type="button"
              role="tab"
              id="tab-schools"
              aria-selected={activeTab === "schools"}
              aria-controls="panel-schools"
              tabIndex={activeTab === "schools" ? 0 : -1}
              onClick={() => setActiveTab("schools")}
              className={`px-4 py-3 text-[14px] font-medium transition-colors ${
                activeTab === "schools"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Schools
            </button>
          </div>

          <div
            id="panel-users"
            role="tabpanel"
            aria-labelledby="tab-users"
            hidden={activeTab !== "users"}
          >
            {activeTab === "users" && <ManageUsers />}
          </div>
          <div
            id="panel-schools"
            role="tabpanel"
            aria-labelledby="tab-schools"
            hidden={activeTab !== "schools"}
          >
            {activeTab === "schools" && <ManageSchools />}
          </div>
        </div>
      </div>
    </div>
  );
}
