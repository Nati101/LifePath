"use client";

import { useEffect, useState } from "react";
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
  
  // Create Advisor Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdvisorEmail, setNewAdvisorEmail] = useState("");
  const [newAdvisorName, setNewAdvisorName] = useState("");
  const [newAdvisorPassword, setNewAdvisorPassword] = useState("");
  const [newAdvisorSchool, setNewAdvisorSchool] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
  }

  async function updateUserRole(userId: string, newRole: "student" | "admin") {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    await loadData();
  }

  async function updateUserSchool(userId: string, schoolId: string) {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("profiles")
      .update({ 
        school_id: schoolId || null,
      })
      .eq("id", userId);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    await loadData();
  }

  async function createAdvisor() {
    setCreateError("");
    setCreateSuccess("");
    setCreating(true);

    const supabase = createClient();

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: newAdvisorEmail,
      password: newAdvisorPassword,
      email_confirm: true,
      user_metadata: {
        full_name: newAdvisorName,
      },
    });

    if (authError) {
      setCreateError(authError.message);
      setCreating(false);
      return;
    }

    // Update profile to admin and assign school
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        full_name: newAdvisorName,
        school_id: newAdvisorSchool || null,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      setCreateError(profileError.message);
      setCreating(false);
      return;
    }

    setCreateSuccess(`Advisor ${newAdvisorName} created successfully!`);
    setNewAdvisorEmail("");
    setNewAdvisorName("");
    setNewAdvisorPassword("");
    setNewAdvisorSchool("");
    setCreating(false);
    setShowCreateForm(false);
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
      {/* Stats */}
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

      {/* Create Advisor Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          + Create New Advisor
        </button>
      )}

      {/* Create Advisor Form */}
      {showCreateForm && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold">Create New Advisor</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreateError("");
                setCreateSuccess("");
              }}
              className="text-[14px] text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="form-field">
            <label htmlFor="advisorName" className="field-label">Full Name</label>
            <input
              id="advisorName"
              type="text"
              value={newAdvisorName}
              onChange={(e) => setNewAdvisorName(e.target.value)}
              placeholder="John Doe"
              className="input-field"
            />
          </div>

          <div className="form-field">
            <label htmlFor="advisorEmail" className="field-label">Email</label>
            <input
              id="advisorEmail"
              type="email"
              value={newAdvisorEmail}
              onChange={(e) => setNewAdvisorEmail(e.target.value)}
              placeholder="advisor@school.edu"
              className="input-field"
            />
          </div>

          <div className="form-field">
            <label htmlFor="advisorPassword" className="field-label">Password</label>
            <input
              id="advisorPassword"
              type="password"
              value={newAdvisorPassword}
              onChange={(e) => setNewAdvisorPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              className="input-field"
            />
          </div>

          <div className="form-field">
            <label htmlFor="advisorSchool" className="field-label">Assign to School</label>
            <div className="select-wrap">
              <select
                id="advisorSchool"
                value={newAdvisorSchool}
                onChange={(e) => setNewAdvisorSchool(e.target.value)}
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

          {createError && (
            <p className="text-[14px] text-danger">{createError}</p>
          )}

          {createSuccess && (
            <p className="text-[14px] font-medium text-primary">{createSuccess}</p>
          )}

          <button
            onClick={createAdvisor}
            disabled={creating || !newAdvisorEmail || !newAdvisorName || !newAdvisorPassword}
            className="btn-primary"
          >
            {creating ? "Creating…" : "Create Advisor"}
          </button>
        </div>
      )}

      {/* Filters */}
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

      {/* Users Table */}
      <div className="admin-table-wrap surface-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>School</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
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
                    onChange={(e) => updateUserRole(user.id, e.target.value as "student" | "admin")}
                    disabled={user.is_super_admin}
                    className="select-field text-[13px]"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Advisor</option>
                  </select>
                </td>
                <td>
                  <select
                    value={user.school_id || ""}
                    onChange={(e) => updateUserSchool(user.id, e.target.value)}
                    className="select-field text-[13px]"
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
            ))}
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
