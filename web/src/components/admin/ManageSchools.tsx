"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface School {
  id: string;
  name: string;
  created_at: string;
}

export default function ManageSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
    setLoadError("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    setSchools(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    void loadSchools();
  }, [loadSchools]);

  const filteredSchools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return schools;
    return schools.filter((school) => school.name.toLowerCase().includes(query));
  }, [schools, searchQuery]);

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
    setFormSuccess("");
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
    setFormSuccess("School name updated.");
    await loadSchools();
  }

  async function confirmDeleteSchool() {
    if (!pendingDelete) return;
    setFormError("");
    setFormSuccess("");
    setRowBusyId(pendingDelete.id);

    const supabase = createClient();
    const { error } = await supabase.from("schools").delete().eq("id", pendingDelete.id);

    if (error) {
      setFormError(error.message);
      setRowBusyId(null);
      setPendingDelete(null);
      return;
    }

    setFormSuccess(`Deleted "${pendingDelete.name}".`);
    setPendingDelete(null);
    setRowBusyId(null);
    await loadSchools();
  }

  if (loading) {
    return <p className="text-[15px] text-muted">Loading schools…</p>;
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
            void loadSchools();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-card__label">Schools</p>
          <p className="admin-stat-card__value admin-stat-card__value--accent">
            {schools.length}
          </p>
        </div>
      </div>

      {formSuccess && <p className="admin-manage-banner">{formSuccess}</p>}
      {formError && <p className="text-[14px] text-danger">{formError}</p>}

      <div className="admin-toolbar surface-card">
        <label className="admin-search">
          <span className="sr-only">Search schools</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schools"
            className="input-field admin-search__input"
          />
        </label>

        <div className="admin-toolbar__filters">
          <button
            type="button"
            className="btn-primary-sm admin-toolbar__action"
            onClick={() => {
              setShowCreateForm((open) => !open);
              setFormError("");
              if (!showCreateForm) setFormSuccess("");
            }}
          >
            {showCreateForm ? "Close" : "Add school"}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={(e) => void createSchool(e)} className="admin-manage-panel surface-card">
          <p className="admin-manage-panel__title">New school</p>
          <div className="admin-manage-panel__fields">
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
          </div>
          <button
            type="submit"
            disabled={creating || !newSchoolName.trim()}
            className="btn-primary-sm"
          >
            {creating ? "Creating…" : "Create school"}
          </button>
        </form>
      )}

      {pendingDelete && (
        <div className="admin-manage-panel surface-card border border-danger/30">
          <p className="text-[15px] text-foreground">
            Delete <span className="font-semibold">{pendingDelete.name}</span>? Advisors and
            students at this school will be unassigned.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-danger"
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

      <div className="admin-results-meta">
        Showing {filteredSchools.length} of {schools.length}
      </div>

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
            {filteredSchools.map((school) => {
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
                          className="admin-link text-danger"
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
            {filteredSchools.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-empty">
                  {schools.length === 0
                    ? "No schools yet. Add one to assign advisors and students."
                    : "No schools match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card-list">
        {filteredSchools.map((school) => {
          const busy = rowBusyId === school.id;
          const editing = editingId === school.id;
          return (
            <div key={school.id} className="admin-manage-card surface-card">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="input-field"
                    aria-label={`Edit name for ${school.name}`}
                  />
                  <div className="flex gap-3">
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
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="admin-row__name">{school.name}</p>
                    <p className="text-[12px] text-muted-light">
                      Created {new Date(school.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="admin-link"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(school.id);
                        setEditingName(school.name);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-link text-danger"
                      disabled={busy}
                      onClick={() => setPendingDelete(school)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {filteredSchools.length === 0 && (
          <div className="admin-empty-card surface-card">
            {schools.length === 0
              ? "No schools yet. Add one to assign advisors and students."
              : "No schools match your search."}
          </div>
        )}
      </div>
    </div>
  );
}
