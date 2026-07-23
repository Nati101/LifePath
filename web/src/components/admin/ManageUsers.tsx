"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "admin";
  school_id: string | null;
  is_super_admin: boolean;
  created_at: string;
}

interface School {
  id: string;
  name: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admin" | "student">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");

  const [showPromoteForm, setShowPromoteForm] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteName, setPromoteName] = useState("");
  const [promoteSchool, setPromoteSchool] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState("");
  const [promoteSuccess, setPromoteSuccess] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [usersRes, schoolsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, school_id, is_super_admin, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name").order("name"),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (schoolsRes.data) setSchools(schoolsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Data load for super-admin tables; async setState after await is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    void loadData();
  }, [loadData]);

  async function updateUserRole(userId: string, newRole: "student" | "admin") {
    setRowError("");
    setRowBusyId(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      setRowError(error.message);
      setRowBusyId(null);
      return;
    }

    await loadData();
    setRowBusyId(null);
  }

  async function updateUserSchool(userId: string, schoolId: string) {
    setRowError("");
    setRowBusyId(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ school_id: schoolId || null })
      .eq("id", userId);

    if (error) {
      setRowError(error.message);
      setRowBusyId(null);
      return;
    }

    await loadData();
    setRowBusyId(null);
  }

  async function promoteAdvisor(e: React.FormEvent) {
    e.preventDefault();
    setPromoteError("");
    setPromoteSuccess("");
    setPromoting(true);

    const email = promoteEmail.trim().toLowerCase();
    if (!email) {
      setPromoteError("Email is required.");
      setPromoting(false);
      return;
    }

    const supabase = createClient();
    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_super_admin")
      .ilike("email", email)
      .maybeSingle();

    if (findError) {
      setPromoteError(findError.message);
      setPromoting(false);
      return;
    }

    if (!existing) {
      setPromoteError(
        "No account with that email. Ask them to register on LifePath first, then promote them here.",
      );
      setPromoting(false);
      return;
    }

    if (existing.is_super_admin) {
      setPromoteError("That account is a super admin and cannot be changed here.");
      setPromoting(false);
      return;
    }

    const updates: {
      role: "admin";
      school_id: string | null;
      full_name?: string;
    } = {
      role: "admin",
      school_id: promoteSchool || null,
    };

    const name = promoteName.trim();
    if (name) updates.full_name = name;

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", existing.id);

    if (updateError) {
      setPromoteError(updateError.message);
      setPromoting(false);
      return;
    }

    setPromoteSuccess(`${existing.email} is now an advisor.`);
    setPromoteEmail("");
    setPromoteName("");
    setPromoteSchool("");
    setPromoting(false);
    setShowPromoteForm(false);
    await loadData();
  }

  const filteredUsers = users.filter((user) => {
    if (filter === "admin" && user.role !== "admin") return false;
    if (filter === "student" && user.role !== "student") return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        false
      );
    }

    return true;
  });

  if (loading) {
    return <p className="text-[15px] text-muted">Loading users…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Total Users</p>
          <p className="admin-stat-card__value">{users.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Advisors</p>
          <p className="admin-stat-card__value admin-stat-card__value--accent">
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Students</p>
          <p className="admin-stat-card__value">
            {users.filter((u) => u.role === "student").length}
          </p>
        </div>
      </div>

      {!showPromoteForm && (
        <button
          type="button"
          onClick={() => {
            setShowPromoteForm(true);
            setPromoteError("");
            setPromoteSuccess("");
          }}
          className="btn-primary"
        >
          + Promote to advisor
        </button>
      )}

      {showPromoteForm && (
        <form onSubmit={(e) => void promoteAdvisor(e)} className="surface-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold">Promote existing user</h3>
            <button
              type="button"
              onClick={() => {
                setShowPromoteForm(false);
                setPromoteError("");
                setPromoteSuccess("");
              }}
              className="text-[14px] text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <p className="text-[14px] leading-relaxed text-muted">
            The person must already have a LifePath account (register as a student first).
            This grants advisor access; it does not create a new login.
          </p>

          <div className="form-field">
            <label htmlFor="promoteEmail" className="field-label">
              Email
            </label>
            <input
              id="promoteEmail"
              type="email"
              required
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              placeholder="advisor@school.edu"
              className="input-field"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor="promoteName" className="field-label">
              Display name (optional)
            </label>
            <input
              id="promoteName"
              type="text"
              value={promoteName}
              onChange={(e) => setPromoteName(e.target.value)}
              placeholder="Leave blank to keep current name"
              className="input-field"
            />
          </div>

          <div className="form-field">
            <label htmlFor="promoteSchool" className="field-label">
              Assign to school
            </label>
            <div className="select-wrap">
              <select
                id="promoteSchool"
                value={promoteSchool}
                onChange={(e) => setPromoteSchool(e.target.value)}
                className="select-field"
              >
                <option value="">No school (assign later)</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {promoteError && <p className="text-[14px] text-danger">{promoteError}</p>}
          {promoteSuccess && (
            <p className="text-[14px] font-medium text-primary">{promoteSuccess}</p>
          )}

          <button type="submit" disabled={promoting || !promoteEmail.trim()} className="btn-primary">
            {promoting ? "Saving…" : "Make advisor"}
          </button>
        </form>
      )}

      {rowError && <p className="text-[14px] text-danger">{rowError}</p>}

      <div className="admin-toolbar surface-card">
        <label className="admin-search">
          <span className="sr-only">Search users</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            className="input-field admin-search__input"
          />
        </label>

        <div className="admin-toolbar__filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="select-field admin-toolbar__select"
            aria-label="Filter by role"
          >
            <option value="all">All Users</option>
            <option value="admin">Advisors Only</option>
            <option value="student">Students Only</option>
          </select>
        </div>
      </div>

      <div className="admin-results-meta">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      <div className="admin-table-wrap surface-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>School</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const busy = rowBusyId === user.id;
              const label = user.full_name?.trim() || user.email;
              return (
                <tr key={user.id} className="admin-row">
                  <td className="admin-row__name">
                    {user.full_name || "—"}
                    {user.is_super_admin && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        SUPER ADMIN
                      </span>
                    )}
                  </td>
                  <td className="admin-row__email">{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        void updateUserRole(user.id, e.target.value as "student" | "admin")
                      }
                      disabled={user.is_super_admin || busy}
                      className="select-field text-[13px]"
                      aria-label={`Role for ${label}`}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Advisor</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={user.school_id || ""}
                      onChange={(e) => void updateUserSchool(user.id, e.target.value)}
                      disabled={busy}
                      className="select-field text-[13px]"
                      aria-label={`School for ${label}`}
                    >
                      <option value="">No school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-row__meta text-[12px] text-muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
