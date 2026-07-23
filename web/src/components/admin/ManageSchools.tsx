"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<School | null>(null);

  const loadSchools = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setSchools(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    void loadSchools();
  }, [loadSchools]);

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setFormError("");
    setFormSuccess("");
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase.from("schools").insert({ name: newSchoolName.trim() });

    if (error) {
      setFormError(error.message);
      setCreating(false);
      return;
    }

    setFormSuccess(`School "${newSchoolName.trim()}" created.`);
    setNewSchoolName("");
    setCreating(false);
    setShowCreateForm(false);
    await loadSchools();
  }

  async function updateSchool(id: string, name: string) {
    setFormError("");
    setRowBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("schools").update({ name }).eq("id", id);

    if (error) {
      setFormError(error.message);
      setRowBusyId(null);
      return;
    }

    setEditingId(null);
    setEditingName("");
    setRowBusyId(null);
    await loadSchools();
  }

  async function confirmDeleteSchool() {
    if (!pendingDelete) return;
    setFormError("");
    setRowBusyId(pendingDelete.id);

    const supabase = createClient();
    const { error } = await supabase.from("schools").delete().eq("id", pendingDelete.id);

    if (error) {
      setFormError(error.message);
      setRowBusyId(null);
      setPendingDelete(null);
      return;
    }

    setPendingDelete(null);
    setRowBusyId(null);
    await loadSchools();
  }

  if (loading) {
    return <p className="text-[15px] text-muted">Loading schools…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Total Schools</p>
          <p className="admin-stat-card__value admin-stat-card__value--accent">
            {schools.length}
          </p>
        </div>
      </div>

      {!showCreateForm && (
        <button type="button" onClick={() => setShowCreateForm(true)} className="btn-primary">
          + Add school
        </button>
      )}

      {showCreateForm && (
        <form onSubmit={(e) => void createSchool(e)} className="surface-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold">New school</h3>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setFormError("");
              }}
              className="text-[14px] text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <div className="form-field">
            <label htmlFor="schoolName" className="field-label">
              School name
            </label>
            <input
              id="schoolName"
              type="text"
              required
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              className="input-field"
              placeholder="Lincoln High School"
            />
          </div>
          <button type="submit" disabled={creating || !newSchoolName.trim()} className="btn-primary">
            {creating ? "Creating…" : "Create school"}
          </button>
        </form>
      )}

      {formError && <p className="text-[14px] text-danger">{formError}</p>}
      {formSuccess && <p className="text-[14px] font-medium text-primary">{formSuccess}</p>}

      {pendingDelete && (
        <div className="surface-card space-y-3 p-5">
          <p className="text-[15px] text-foreground">
            Delete <span className="font-semibold">{pendingDelete.name}</span>? Advisors and
            students at this school will be unassigned.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={rowBusyId === pendingDelete.id}
              onClick={() => void confirmDeleteSchool()}
            >
              {rowBusyId === pendingDelete.id ? "Deleting…" : "Delete school"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={rowBusyId === pendingDelete.id}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap surface-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => {
              const busy = rowBusyId === school.id;
              const editing = editingId === school.id;
              return (
                <tr key={school.id} className="admin-row">
                  <td>
                    {editing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="input-field"
                        aria-label={`Edit name for ${school.name}`}
                      />
                    ) : (
                      <span className="admin-row__name">{school.name}</span>
                    )}
                  </td>
                  <td className="admin-row__meta text-[13px] text-muted">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                  <td className="admin-row__action">
                    {editing ? (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="admin-link"
                          disabled={busy || !editingName.trim()}
                          onClick={() => void updateSchool(school.id, editingName.trim())}
                        >
                          {busy ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          className="admin-link"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="admin-link"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(school.id);
                            setEditingName(school.name);
                          }}
                          aria-label={`Edit ${school.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-link"
                          disabled={busy}
                          onClick={() => setPendingDelete(school)}
                          aria-label={`Delete ${school.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {schools.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-empty">
                  No schools yet. Add one to assign advisors and students.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
