"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSelector from "@/components/AvatarSelector";
import { createClient } from "@/lib/supabase/client";
import { normalizeAvatar, type AvatarEmoji } from "@/lib/avatars";
import type { SelectOption } from "@/lib/account/options";

interface AccountFormProps {
  userId: string;
  email: string;
  fullName: string;
  displayName: string;
  schoolId: string | null;
  advisorId: string | null;
  avatarEmoji: string | null;
  schools: SelectOption[];
  advisors: SelectOption[];
}

export default function AccountForm({
  userId,
  email,
  fullName: initialName,
  displayName,
  schoolId: initialSchoolId,
  advisorId: initialAdvisorId,
  avatarEmoji: initialAvatar,
  schools,
  advisors,
}: AccountFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [schoolId, setSchoolId] = useState(initialSchoolId ?? "");
  const [advisorId, setAdvisorId] = useState(initialAdvisorId ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji>(
    normalizeAvatar(initialAvatar),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFullName(initialName);
    setSchoolId(initialSchoolId ?? "");
    setAdvisorId(initialAdvisorId ?? "");
    setAvatarEmoji(normalizeAvatar(initialAvatar));
  }, [initialName, initialSchoolId, initialAdvisorId, initialAvatar]);

  const dirty =
    fullName.trim() !== initialName.trim() ||
    schoolId !== (initialSchoolId ?? "") ||
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

    const selectedSchool = schools.find((item) => item.id === schoolId);
    const selectedAdvisor = advisors.find((item) => item.id === advisorId);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        school_id: schoolId || null,
        advisor_id: advisorId || null,
        school_name: selectedSchool?.name ?? null,
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

          <p className="form-section-title">School Information</p>

          <div className="form-field">
            <label htmlFor="schoolId" className="field-label">
              School
            </label>
            <div className="select-wrap">
              <select
                id="schoolId"
                value={schoolId}
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  setSaved(false);
                }}
                className="select-field"
                disabled={schools.length === 0}
              >
                <option value="">
                  {schools.length === 0 ? "No schools available" : "Select a school"}
                </option>
                {schools.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {schools.length === 0 && (
              <p className="field-hint">
                Schools haven&apos;t been set up yet. Contact your administrator.
              </p>
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
