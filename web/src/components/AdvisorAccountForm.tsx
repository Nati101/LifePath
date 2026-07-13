"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvatarSelector from "@/components/AvatarSelector";
import { createClient, withBasePath } from "@/lib/supabase/client";
import { normalizeAvatar, type AvatarEmoji } from "@/lib/avatars";

interface AdvisorAccountFormProps {
  userId: string;
  email: string;
  fullName: string;
  displayName: string;
  schoolId: string | null;
  schoolName: string | null;
  avatarEmoji: string | null;
  isSuperAdmin: boolean;
}

export default function AdvisorAccountForm({
  userId,
  email,
  fullName: initialName,
  displayName,
  schoolId,
  schoolName,
  avatarEmoji: initialAvatar,
  isSuperAdmin,
}: AdvisorAccountFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji>(
    normalizeAvatar(initialAvatar),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty =
    fullName.trim() !== initialName.trim() ||
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

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name,
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
    <div className="space-y-6">
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
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
              Advisor
            </span>
            {isSuperAdmin && (
              <span className="rounded-full bg-primary px-3 py-1 text-[13px] font-semibold text-white">
                Super Admin
              </span>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="surface-card p-5 sm:p-6">
          <h2 className="mb-4 text-[17px] font-semibold text-foreground">
            Personal Information
          </h2>
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
              <p className="field-hint">Your email address cannot be changed</p>
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
          </div>
        </div>

        {/* School Assignment */}
        <div className="surface-card p-5 sm:p-6">
          <h2 className="mb-4 text-[17px] font-semibold text-foreground">
            School Assignment
          </h2>
          <div className="space-y-4">
            <div className="form-field">
              <label className="field-label">Assigned School</label>
              <div className="rounded-lg bg-muted/20 px-4 py-3 text-[15px] text-foreground">
                {schoolName || "Not assigned to a school"}
              </div>
              {schoolName ? (
                <p className="field-hint">
                  You are assigned to {schoolName}. Students can select you as their advisor.
                </p>
              ) : (
                <p className="field-hint">
                  Contact a super admin to be assigned to a school.
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
            Changes saved successfully
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

      {/* Quick Links */}
      <div className="surface-card p-5 sm:p-6">
        <h2 className="mb-4 text-[17px] font-semibold text-foreground">
          Quick Links
        </h2>
        <div className="space-y-3">
          <Link
            href={withBasePath("/admin")}
            className="block rounded-lg border border-border px-4 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-background"
          >
            📊 View Student Dashboard →
          </Link>
          {isSuperAdmin && (
            <Link
              href={withBasePath("/admin/manage")}
              className="block rounded-lg border border-border px-4 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-background"
            >
              ⚙️ Manage Users & Schools →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
