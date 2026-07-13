"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface School {
  id: string;
  name: string;
  created_at: string;
}

export default function ManageSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    const supabase = createClient();
    const { data } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setSchools(data);
    setLoading(false);
  }

  async function createSchool() {
    if (!newSchoolName.trim()) return;

    setCreateError("");
    setCreateSuccess("");
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("schools")
      .insert({ name: newSchoolName.trim() });

    if (error) {
      setCreateError(error.message);
      setCreating(false);
      return;
    }

    setCreateSuccess(`School "${newSchoolName}" created successfully!`);
    setNewSchoolName("");
    setCreating(false);
    setShowCreateForm(false);
    await loadSchools();
  }

  async function updateSchool(id: string, name: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("schools")
      .update({ name })
      .eq("id", id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    setEditingId(null);
    setEditingName("");
    await loadSchools();
  }

  async function deleteSchool(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will unassign all advisors and students from this school.`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("schools")
      .delete()
      .eq("id", id);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    await loadSchools();
  }

  if (loading) {
    return <p className="text-[15px] text-muted">Loading schools…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Total Schools</p>
          <p className="admin-stat-card__value admin-stat-card__value--accent">
            {schools.length}
          </p>
        </div>
      </div>

      {/* Create School Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          + Create New School
        </button>
      )}

      {/* Create School Form */}
      {showCreateForm && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold">Create New School</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreateError("");
                setCreateSuccess("");
                setNewSchoolName("");
              }}
              className="text-[14px] text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="form-field">
            <label htmlFor="schoolName" className="field-label">School Name</label>
            <input
              id="schoolName"
              type="text"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              placeholder="e.g., Lincoln High School"
              className="input-field"
            />
          </div>

          {createError && (
            <p className="text-[14px] text-danger">{createError}</p>
          )}

          {createSuccess && (
            <p className="text-[14px] font-medium text-primary">{createSuccess}</p>
          )}

          <button
            onClick={createSchool}
            disabled={creating || !newSchoolName.trim()}
            className="btn-primary"
          >
            {creating ? "Creating…" : "Create School"}
          </button>
        </div>
      )}

      {/* Schools List */}
      <div className="space-y-3">
        {schools.map((school) => (
          <div key={school.id} className="surface-card p-5 flex items-center justify-between">
            {editingId === school.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="input-field flex-1 mr-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSchool(school.id, editingName)}
                    className="btn-secondary text-[13px] px-3 py-1.5"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditingName("");
                    }}
                    className="btn-secondary text-[13px] px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-[16px] font-semibold text-foreground">{school.name}</h3>
                  <p className="text-[13px] text-muted mt-1">
                    Created {new Date(school.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(school.id);
                      setEditingName(school.name);
                    }}
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSchool(school.id, school.name)}
                    className="text-[13px] font-medium text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {schools.length === 0 && (
          <div className="surface-card p-8 text-center text-muted">
            No schools yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
