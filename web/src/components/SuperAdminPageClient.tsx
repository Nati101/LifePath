"use client";

import Link from "next/link";
import ManageUsers from "@/components/admin/ManageUsers";
import ManageSchools from "@/components/admin/ManageSchools";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { withBasePath } from "@/lib/supabase/client";
import { useState } from "react";

type Tab = "people" | "schools";

export default function SuperAdminPageClient() {
  const ready = useAuthGuard({ superAdmin: true });
  const [activeTab, setActiveTab] = useState<Tab>("people");

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
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="admin-page__title">Manage</h1>
                <p className="admin-page__subtitle">Advisors, schools, and accounts.</p>
              </div>
              <Link
                href={withBasePath("/admin")}
                className="text-[14px] font-medium text-primary hover:underline"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          <div
            className="admin-manage-tabs"
            role="tablist"
            aria-label="Management sections"
          >
            <button
              type="button"
              role="tab"
              id="tab-people"
              aria-selected={activeTab === "people"}
              aria-controls="panel-people"
              tabIndex={activeTab === "people" ? 0 : -1}
              onClick={() => setActiveTab("people")}
              className={`admin-manage-tab${activeTab === "people" ? " admin-manage-tab--active" : ""}`}
            >
              People
            </button>
            <button
              type="button"
              role="tab"
              id="tab-schools"
              aria-selected={activeTab === "schools"}
              aria-controls="panel-schools"
              tabIndex={activeTab === "schools" ? 0 : -1}
              onClick={() => setActiveTab("schools")}
              className={`admin-manage-tab${activeTab === "schools" ? " admin-manage-tab--active" : ""}`}
            >
              Schools
            </button>
          </div>

          <div
            id="panel-people"
            role="tabpanel"
            aria-labelledby="tab-people"
            hidden={activeTab !== "people"}
          >
            {activeTab === "people" && <ManageUsers />}
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
