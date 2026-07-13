"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import ManageUsers from "@/components/admin/ManageUsers";
import ManageSchools from "@/components/admin/ManageSchools";

type Tab = "users" | "schools";

export default function SuperAdminPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("users");

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_super_admin) {
        router.replace(withBasePath("/admin"));
        return;
      }

      setIsSuperAdmin(true);
      setLoading(false);
    }

    void checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-page-content">
          <p className="text-[15px] text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="admin-shell">
      <div className="admin-page-content">
        <div className="admin-page">
          <div className="admin-page__header">
            <div className="flex items-center justify-between">
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

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 border-b border-border">
            <button
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

          {/* Tab Content */}
          {activeTab === "users" && <ManageUsers />}
          {activeTab === "schools" && <ManageSchools />}
        </div>
      </div>
    </div>
  );
}
