"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSelector from "@/components/AvatarSelector";
import { createClient } from "@/lib/supabase/client";
import { normalizeAvatar, type AvatarEmoji } from "@/lib/avatars";
import type { AdvisorOption, SelectOption } from "@/lib/account/options";

interface AccountFormProps {
  userId: string;
  email: string;
  fullName: string;
  displayName: string;
  classId: string | null;
  advisorId: string | null;
  avatarEmoji: string | null;
  classes: SelectOption[];
  advisors: AdvisorOption[];
}

export default function AccountForm({
  userId,
  email,
  fullName: initialName,
  displayName,
  classId: initialClassId,
  advisorId: initialAdvisorId,
  avatarEmoji: initialAvatar,
  classes: initialClasses,
  advisors,
}: AccountFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [classId, setClassId] = useState(initialClassId ?? "");
  const [advisorId, setAdvisorId] = useState(initialAdvisorId ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji>(
    normalizeAvatar(initialAvatar),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<SelectOption[]>(initialClasses);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    setFullName(initialName);
    setClassId(initialClassId ?? "");
    setAdvisorId(initialAdvisorId ?? "");
    setAvatarEmoji(normalizeAvatar(initialAvatar));
    setClasses(initialClasses);
  }, [initialName, initialClassId, initialAdvisorId, initialAvatar, initialClasses]);

  // When advisor changes, reload classes filtered by their school
  useEffect(() => {
    const selectedAdvisor = advisors.find((a) => a.id === advisorId);
    
    async function loadClasses() {
      setLoadingClasses(true);
      const supabase = createClient();
      
      try {
        let query = supabase.from("classes").select("id, name").order("name");
        
        // If advisor has a school, filter by it
        if (selectedAdvisor?.schoolId) {
          query = query.eq("school_id", selectedAdvisor.schoolId);
        }
        
        const { data } = await query;
        const newClasses = (data ?? []).map((row) => ({ id: row.id, name: row.name }));
        setClasses(newClasses);
        
        // If current class is not in the filtered list, clear it
        if (classId && selectedAdvisor?.schoolId && !newClasses.some((c) => c.id === classId)) {
          setClassId("");
        }
      } catch (error) {
        console.error("Failed to load classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    }
    
    void loadClasses();
  }, [advisorId, advisors, classId]);

  const dirty =
    fullName.trim() !== initialName.trim() ||
    classId !== (initialClassId ?? "") ||
    advisorId !== (initialAdvisorId ?? "") ||
    avatarEmoji !== normalizeAvatar(initialAvatar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);

    const name = fullName.trim();
    if (!name) {
      setError("Name is required.");
      setLoading(false);
      return;
    }

    const selectedClass = classes.find((item) => item.id === classId);
    const selectedAdvisor = advisors.find((item) => item.id === advisorId);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        class_id: classId || null,
        advisor_id: advisorId || null,
        class_name: selectedClass?.name ?? null,
        advisor: selectedAdvisor?.name ?? null,
        avatar_emoji: avatarEmoji,
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { full_name: name, avatar_emoji: avatarEmoji },
    });

    setLoading(false);
    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <AvatarSelector
          value={avatarEmoji}
          onChange={(emoji) => {
            setAvatarEmoji(emoji);
            setSaved(false);
          }}
        />
        <h1 className="mt-5 text-[26px] font-semibold tracking-tight text-foreground">
          {displayName}
        </h1>
        <p className="mt-1 text-[15px] text-muted">Account settings</p>
      </div>

      <div className="surface-card p-5 sm:p-6">
        <div className="space-y-4">
          <div className="form-field">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="input-field"
            />
          </div>

          <div className="form-field">
            <label htmlFor="fullName" className="field-label">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSaved(false);
              }}
              className="input-field"
            />
          </div>

          <div className="form-divider" />

          <p className="form-section-title">School</p>

          <div className="form-field">
            <label htmlFor="classId" className="field-label">
              Class
            </label>
            <div className="select-wrap">
              <select
                id="classId"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSaved(false);
                }}
                className="select-field"
                disabled={loadingClasses}
              >
                <option value="">
                  {loadingClasses ? "Loading classes..." : "Select a class"}
                </option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {!loadingClasses && classes.length === 0 && advisorId && (
              <p className="field-hint">
                No classes available for this advisor&apos;s school. Ask your advisor to set up classes.
              </p>
            )}
            {!loadingClasses && classes.length === 0 && !advisorId && (
              <p className="field-hint">Classes haven&apos;t been set up yet.</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="advisorId" className="field-label">
              Advisor
            </label>
            <div className="select-wrap">
              <select
                id="advisorId"
                value={advisorId}
                onChange={(e) => {
                  setAdvisorId(e.target.value);
                  setSaved(false);
                }}
                className="select-field"
                disabled={advisors.length === 0}
              >
                <option value="">
                  {advisors.length === 0
                    ? "No advisors available"
                    : "Select an advisor"}
                </option>
                {advisors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {advisors.length === 0 && (
              <p className="field-hint">
                Ask your teacher to create an admin account first.
              </p>
            )}
            {advisors.length > 0 && (
              <p className="field-hint">
                Your advisor determines which classes you can select.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-center text-[14px] text-danger">{error}</p>
      )}

      {saved && !dirty && (
        <p className="text-center text-[14px] font-medium text-primary">
          Changes saved
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !dirty}
        className="btn-primary"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
