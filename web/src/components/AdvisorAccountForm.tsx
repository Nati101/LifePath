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
  profilePictureUrl: string | null;
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
  profilePictureUrl: initialProfilePictureUrl,
  isSuperAdmin,
}: AdvisorAccountFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji>(
    normalizeAvatar(initialAvatar),
  );
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(initialProfilePictureUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty =
    fullName.trim() !== initialName.trim() ||
    avatarEmoji !== normalizeAvatar(initialAvatar) ||
    profilePictureUrl !== initialProfilePictureUrl;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');
    setSaved(false);

    try {
      const supabase = createClient();
      
      // Delete old profile picture if it exists
      if (profilePictureUrl) {
        const oldPath = profilePictureUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('profile-pictures').remove([oldPath]);
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setProfilePictureUrl(publicUrl);
      setUploadingImage(false);
    } catch (err) {
      setError('Failed to upload image');
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profilePictureUrl) return;

    setUploadingImage(true);
    setError('');
    setSaved(false);

    try {
      const supabase = createClient();
      const oldPath = profilePictureUrl.split('/').slice(-2).join('/');
      
      await supabase.storage.from('profile-pictures').remove([oldPath]);
      setProfilePictureUrl(null);
      setUploadingImage(false);
    } catch (err) {
      setError('Failed to remove image');
      setUploadingImage(false);
    }
  };

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
        profile_picture_url: profilePictureUrl,
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { full_name: name, avatar_emoji: avatarEmoji, profile_picture_url: profilePictureUrl },
    });

    setLoading(false);
    setSaved(true);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          {/* Profile Picture or Avatar */}
          <div className="relative inline-block">
            {profilePictureUrl ? (
              <div className="relative">
                <img 
                  src={profilePictureUrl} 
                  alt="Profile" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-primary/20"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 rounded-full bg-danger p-2 text-white shadow-lg hover:bg-danger/90 transition-colors"
                  title="Remove profile picture"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <AvatarSelector
                value={avatarEmoji}
                onChange={(emoji) => {
                  setAvatarEmoji(emoji);
                  setSaved(false);
                }}
              />
            )}
          </div>

          {/* Upload Button */}
          <div className="mt-4">
            <label 
              htmlFor="profile-picture-upload" 
              className="inline-flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-primary bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
            >
              {uploadingImage ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  {profilePictureUrl ? 'Change' : 'Upload'} Profile Picture
                </>
              )}
            </label>
            <input
              id="profile-picture-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
            <p className="mt-2 text-[13px] text-muted">
              {profilePictureUrl ? 'Upload a new image to replace your current profile picture' : 'Upload an image (max 5MB) or keep using emoji avatar'}
            </p>
          </div>

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
