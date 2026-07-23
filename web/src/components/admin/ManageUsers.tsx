"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";
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

type PendingConfirm =
  | { kind: "demote"; user: User; label: string }
  | { kind: "grant_sa"; user: User; label: string }
  | { kind: "revoke_sa"; user: User; label: string };

const PAGE_SIZE = 50;

function roleLabel(role: "student" | "admin") {
  return role === "admin" ? "Advisor" : "Student";
}

function displayName(user: Pick<User, "full_name" | "email">) {
  return user.full_name?.trim() || user.email;
}

function NameCell({
  name,
  isSuperAdmin,
}: {
  name: string;
  isSuperAdmin?: boolean;
}) {
  return (
    <div className="admin-name-cell">
      <span className="admin-name-cell__text">{name}</span>
      {isSuperAdmin && <span className="admin-super-badge">Super admin</span>}
    </div>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "student">("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");
  const [bannerSuccess, setBannerSuccess] = useState("");

  const [showPromoteForm, setShowPromoteForm] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteName, setPromoteName] = useState("");
  const [promoteSchool, setPromoteSchool] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"student" | "admin">("student");
  const [editSchoolId, setEditSchoolId] = useState("");
  const [editSuperAdmin, setEditSuperAdmin] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoadError("");
    const supabase = createClient();

    const [{ data: authData }, usersRes, schoolsRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("profiles")
        .select("id, email, full_name, role, school_id, is_super_admin, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name").order("name"),
    ]);

    if (usersRes.error || schoolsRes.error) {
      setLoadError(
        usersRes.error?.message || schoolsRes.error?.message || "Failed to load users.",
      );
      setLoading(false);
      return;
    }

    setCurrentUserId(authData.user?.id ?? null);
    setUsers(usersRes.data ?? []);
    setSchools(schoolsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    void loadData();
  }, [loadData]);

  async function clearAdvisorAssignments(
    supabase: ReturnType<typeof createClient>,
    advisorId: string,
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({ advisor_id: null })
      .eq("advisor_id", advisorId);

    if (error) {
      throw new Error(`Role updated, but clearing student advisor links failed: ${error.message}`);
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditName(user.full_name?.trim() || "");
    setEditRole(user.role);
    setEditSchoolId(user.school_id || "");
    setEditSuperAdmin(user.is_super_admin);
    setRowError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setRowBusyId(null);
    setPendingConfirm(null);
  }

  async function applyEdit(user: User) {
    const nextSuperAdmin = editSuperAdmin;
    const nextRole: "student" | "admin" = nextSuperAdmin ? "admin" : editRole;
    const nextName = editName.trim();
    const roleChanged = nextRole !== user.role;
    const schoolChanged = (editSchoolId || null) !== user.school_id;
    const superChanged = nextSuperAdmin !== user.is_super_admin;
    const nameChanged = nextName !== (user.full_name?.trim() || "");

    setRowError("");
    setBannerSuccess("");
    setRowBusyId(user.id);
    const supabase = createClient();

    const updates: {
      role?: "student" | "admin";
      school_id?: string | null;
      is_super_admin?: boolean;
      full_name?: string;
    } = {};
    if (roleChanged) updates.role = nextRole;
    if (schoolChanged) updates.school_id = editSchoolId || null;
    if (nameChanged) updates.full_name = nextName;
    if (superChanged) {
      updates.is_super_admin = nextSuperAdmin;
      if (nextSuperAdmin) updates.role = "admin";
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

    if (error) {
      setRowError(error.message);
      setRowBusyId(null);
      setConfirmBusy(false);
      setPendingConfirm(null);
      return;
    }

    if (roleChanged && nextRole === "student") {
      try {
        await clearAdvisorAssignments(supabase, user.id);
      } catch (err) {
        setRowError(err instanceof Error ? err.message : "Failed to clear advisor links");
        setRowBusyId(null);
        setConfirmBusy(false);
        setPendingConfirm(null);
        setEditingId(null);
        await loadData();
        return;
      }
    }

    setEditingId(null);
    setRowBusyId(null);
    setConfirmBusy(false);
    setPendingConfirm(null);
    await loadData();
  }

  async function saveEdit(user: User) {
    const isSelf = currentUserId === user.id;
    const nextSuperAdmin = editSuperAdmin;
    const nextRole: "student" | "admin" = nextSuperAdmin ? "admin" : editRole;
    const nextName = editName.trim();
    const label = nextName || displayName(user);

    if (isSelf && user.is_super_admin && !nextSuperAdmin) {
      setRowError("You can’t remove your own super admin access.");
      return;
    }

    if (isSelf && nextRole === "student") {
      setRowError("You can’t demote your own account to student.");
      return;
    }

    const roleChanged = nextRole !== user.role;
    const schoolChanged = (editSchoolId || null) !== user.school_id;
    const superChanged = nextSuperAdmin !== user.is_super_admin;
    const nameChanged = nextName !== (user.full_name?.trim() || "");

    if (!roleChanged && !schoolChanged && !superChanged && !nameChanged) {
      cancelEdit();
      return;
    }

    if (user.role === "admin" && nextRole === "student") {
      setPendingConfirm({ kind: "demote", user, label });
      return;
    }

    if (!user.is_super_admin && nextSuperAdmin) {
      setPendingConfirm({ kind: "grant_sa", user, label });
      return;
    }

    if (user.is_super_admin && !nextSuperAdmin) {
      setPendingConfirm({ kind: "revoke_sa", user, label });
      return;
    }

    await applyEdit(user);
  }

  async function handleConfirmPending() {
    if (!pendingConfirm) return;
    setConfirmBusy(true);
    await applyEdit(pendingConfirm.user);
  }

  async function promoteAdvisor(e: React.FormEvent) {
    e.preventDefault();
    setPromoteError("");
    setBannerSuccess("");
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
      setPromoteError("That account is already a super admin.");
      setPromoting(false);
      return;
    }

    if (existing.role === "admin") {
      setPromoteError("That account is already an advisor. Edit their school in the list below.");
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

    setBannerSuccess(`${existing.email} is now an advisor.`);
    setPromoteEmail("");
    setPromoteName("");
    setPromoteSchool("");
    setPromoting(false);
    setShowPromoteForm(false);
    await loadData();
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filter === "admin" && user.role !== "admin") return false;
      if (filter === "student" && user.role !== "student") return false;
      if (schoolFilter === "none" && user.school_id) return false;
      if (schoolFilter !== "all" && schoolFilter !== "none" && user.school_id !== schoolFilter) {
        return false;
      }

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
  }, [users, filter, schoolFilter, searchQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, schoolFilter, searchQuery]);

  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredUsers.length;

  function schoolName(schoolId: string | null) {
    if (!schoolId) return "No school";
    return schools.find((s) => s.id === schoolId)?.name ?? "Unknown school";
  }

  if (loading) {
    return <p className="text-[15px] text-muted">Loading people…</p>;
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="text-[14px] text-danger">{loadError}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setLoading(true);
            void loadData();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="admin-stat-grid admin-stat-grid--3">
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Total</p>
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

      {bannerSuccess && <p className="admin-manage-banner">{bannerSuccess}</p>}
      {rowError && <p className="text-[14px] text-danger">{rowError}</p>}

      <div className="admin-toolbar surface-card">
        <label className="admin-search">
          <span className="sr-only">Search people</span>
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
            <option value="all">All roles</option>
            <option value="admin">Advisors</option>
            <option value="student">Students</option>
          </select>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="select-field admin-toolbar__select"
            aria-label="Filter by school"
          >
            <option value="all">All schools</option>
            <option value="none">No school</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-toolbar__cta">
          <button
            type="button"
            className="btn-primary-sm"
            onClick={() => {
              setShowPromoteForm((open) => !open);
              setPromoteError("");
              if (!showPromoteForm) setBannerSuccess("");
            }}
          >
            {showPromoteForm ? "Close" : "Promote advisor"}
          </button>
        </div>
      </div>

      {showPromoteForm && (
        <form onSubmit={(e) => void promoteAdvisor(e)} className="admin-manage-panel surface-card">
          <p className="admin-manage-panel__title">Promote existing user</p>
          <p className="admin-manage-panel__hint">
            They must already have a LifePath account. This grants advisor access; it does not
            create a login. To grant super admin, edit the person after promoting.
          </p>
          <div className="admin-manage-panel__fields">
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
                placeholder="Keep current name"
                className="input-field"
              />
            </div>
            <div className="form-field">
              <label htmlFor="promoteSchool" className="field-label">
                School
              </label>
              <div className="select-wrap">
                <select
                  id="promoteSchool"
                  value={promoteSchool}
                  onChange={(e) => setPromoteSchool(e.target.value)}
                  className="select-field"
                >
                  <option value="">No school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {promoteError && <p className="text-[14px] text-danger">{promoteError}</p>}
          <button type="submit" disabled={promoting || !promoteEmail.trim()} className="btn-primary-sm">
            {promoting ? "Saving…" : "Make advisor"}
          </button>
        </form>
      )}

      <div className="admin-results-meta">
        Showing {visibleUsers.length} of {filteredUsers.length}
        {filteredUsers.length !== users.length ? ` (filtered from ${users.length})` : ""}
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
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const busy = rowBusyId === user.id;
              const editing = editingId === user.id;
              const label = displayName(user);
              const isSelf = currentUserId === user.id;
              return (
                <Fragment key={user.id}>
                  <tr className={`admin-row${editing ? " admin-row--editing" : ""}`}>
                    <td className="admin-col-name">
                      <NameCell name={label} isSuperAdmin={user.is_super_admin} />
                    </td>
                    <td className="admin-row__email" style={{ marginTop: 0 }}>
                      {user.email}
                    </td>
                    <td>
                      <span className="text-[14px]">{roleLabel(user.role)}</span>
                    </td>
                    <td className="admin-col-school">
                      <span className="text-[14px] text-muted">{schoolName(user.school_id)}</span>
                    </td>
                    <td className="admin-row__meta text-[12px] text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="admin-row__action">
                      {editing ? (
                        <span className="text-[13px] text-muted">Editing…</span>
                      ) : (
                        <button
                          type="button"
                          className="admin-link"
                          onClick={() => startEdit(user)}
                          aria-label={`Edit ${label}`}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                  {editing && (
                    <tr className="admin-row-edit">
                      <td colSpan={6}>
                        <div className="admin-row-edit__panel">
                          <div className="admin-row-edit__fields">
                            <label className="admin-row-edit__field">
                              <span className="field-label">Display name</span>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                disabled={busy}
                                className="input-field admin-row-edit__select"
                                placeholder={user.email}
                                aria-label={`Display name for ${label}`}
                              />
                            </label>
                            <label className="admin-row-edit__field">
                              <span className="field-label">Role</span>
                              <div className="select-wrap">
                                <select
                                  value={editSuperAdmin ? "admin" : editRole}
                                  onChange={(e) => {
                                    const value = e.target.value as "student" | "admin";
                                    setEditRole(value);
                                    if (value === "student") setEditSuperAdmin(false);
                                  }}
                                  disabled={busy || (isSelf && user.is_super_admin)}
                                  className="select-field admin-row-edit__select"
                                  aria-label={`Role for ${label}`}
                                >
                                  <option value="student">Student</option>
                                  <option value="admin">Advisor</option>
                                </select>
                              </div>
                            </label>
                            <label className="admin-row-edit__field">
                              <span className="field-label">School</span>
                              <div className="select-wrap">
                                <select
                                  value={editSchoolId}
                                  onChange={(e) => setEditSchoolId(e.target.value)}
                                  disabled={busy}
                                  className="select-field admin-row-edit__select"
                                  aria-label={`School for ${label}`}
                                >
                                  <option value="">No school</option>
                                  {schools.map((school) => (
                                    <option key={school.id} value={school.id}>
                                      {school.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </label>
                            <label className="admin-row-edit__check">
                              <input
                                type="checkbox"
                                checked={editSuperAdmin}
                                disabled={busy || (isSelf && user.is_super_admin)}
                                onChange={(e) => {
                                  setEditSuperAdmin(e.target.checked);
                                  if (e.target.checked) setEditRole("admin");
                                }}
                              />
                              <span>Super admin</span>
                            </label>
                          </div>
                          <div className="admin-row-edit__actions">
                            <button
                              type="button"
                              className="btn-primary-sm"
                              disabled={busy}
                              onClick={() => void saveEdit(user)}
                            >
                              {busy ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary-sm"
                              disabled={busy}
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No people match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card-list">
        {visibleUsers.map((user) => {
          const busy = rowBusyId === user.id;
          const editing = editingId === user.id;
          const label = displayName(user);
          const isSelf = currentUserId === user.id;
          return (
            <div key={user.id} className="admin-manage-card surface-card">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <NameCell name={label} isSuperAdmin={user.is_super_admin} />
                  <p className="mt-1 text-[13px] text-muted">{user.email}</p>
                  {!editing && (
                    <p className="mt-1 text-[12px] text-muted-light">
                      {roleLabel(user.role)} · {schoolName(user.school_id)} · Joined{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!editing && (
                  <button
                    type="button"
                    className="admin-link shrink-0"
                    onClick={() => startEdit(user)}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing && (
                <div className="admin-row-edit__panel admin-row-edit__panel--card">
                  <div className="admin-row-edit__fields">
                    <label className="admin-row-edit__field">
                      <span className="field-label">Display name</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={busy}
                        className="input-field admin-row-edit__select"
                        placeholder={user.email}
                        aria-label={`Display name for ${label}`}
                      />
                    </label>
                    <label className="admin-row-edit__field">
                      <span className="field-label">Role</span>
                      <div className="select-wrap">
                        <select
                          value={editSuperAdmin ? "admin" : editRole}
                          onChange={(e) => {
                            const value = e.target.value as "student" | "admin";
                            setEditRole(value);
                            if (value === "student") setEditSuperAdmin(false);
                          }}
                          disabled={busy || (isSelf && user.is_super_admin)}
                          className="select-field admin-row-edit__select"
                          aria-label={`Role for ${label}`}
                        >
                          <option value="student">Student</option>
                          <option value="admin">Advisor</option>
                        </select>
                      </div>
                    </label>
                    <label className="admin-row-edit__field">
                      <span className="field-label">School</span>
                      <div className="select-wrap">
                        <select
                          value={editSchoolId}
                          onChange={(e) => setEditSchoolId(e.target.value)}
                          disabled={busy}
                          className="select-field admin-row-edit__select"
                          aria-label={`School for ${label}`}
                        >
                          <option value="">No school</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                    <label className="admin-row-edit__check">
                      <input
                        type="checkbox"
                        checked={editSuperAdmin}
                        disabled={busy || (isSelf && user.is_super_admin)}
                        onChange={(e) => {
                          setEditSuperAdmin(e.target.checked);
                          if (e.target.checked) setEditRole("admin");
                        }}
                      />
                      <span>Super admin</span>
                    </label>
                  </div>
                  <div className="admin-row-edit__actions">
                    <button
                      type="button"
                      className="btn-primary-sm"
                      disabled={busy}
                      onClick={() => void saveEdit(user)}
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      disabled={busy}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="admin-empty-card surface-card">No people match your filters.</div>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
        >
          Show more ({filteredUsers.length - visibleCount} remaining)
        </button>
      )}

      <AdminConfirmModal
        open={pendingConfirm?.kind === "demote"}
        title="Demote to student?"
        body={
          <>
            Demote <span className="font-semibold text-foreground">{pendingConfirm?.label}</span> to
            student? Students assigned to this advisor will be unassigned.
          </>
        }
        confirmLabel="Demote"
        danger
        busy={confirmBusy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmPending()}
      />
      <AdminConfirmModal
        open={pendingConfirm?.kind === "grant_sa"}
        title="Grant super admin?"
        body={
          <>
            Make <span className="font-semibold text-foreground">{pendingConfirm?.label}</span> a
            super admin? They will be able to manage all users and schools.
          </>
        }
        confirmLabel="Grant access"
        busy={confirmBusy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmPending()}
      />
      <AdminConfirmModal
        open={pendingConfirm?.kind === "revoke_sa"}
        title="Remove super admin?"
        body={
          <>
            Remove super admin access from{" "}
            <span className="font-semibold text-foreground">{pendingConfirm?.label}</span>? They
            will remain an advisor.
          </>
        }
        confirmLabel="Remove access"
        danger
        busy={confirmBusy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmPending()}
      />
    </div>
  );
}
