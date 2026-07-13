"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import AdvisorAccountForm from "@/components/AdvisorAccountForm";
import { getAccountOptions } from "@/lib/account/getAccountOptions";
import type { AccountOptions } from "@/lib/account/options";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function AccountPageClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<{
    userId: string;
    email: string;
    fullName: string;
    displayName: string;
    schoolId: string | null;
    schoolName: string | null;
    advisorId: string | null;
    avatarEmoji: string | null;
    profilePictureUrl: string | null;
    role: "student" | "admin";
    isSuperAdmin: boolean;
  } | null>(null);
  const [options, setOptions] = useState<AccountOptions>({ schools: [], advisors: [] });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        router.replace(withBasePath("/login"));
        return;
      }

      const [profileResponse, accountOptions] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, school_id, advisor_id, avatar_emoji, profile_picture_url, role, is_super_admin, schools(name)")
          .eq("id", user.id)
          .single(),
        getAccountOptions(supabase, user.id),
      ]);

      if (cancelled) return;

      const profileData = profileResponse.data;
      const schoolName = profileData?.schools && typeof profileData.schools === 'object' && 'name' in profileData.schools
        ? (profileData.schools as { name: string }).name
        : null;

      setProfile({
        userId: user.id,
        email: profileData?.email ?? user.email ?? "",
        fullName: profileData?.full_name ?? "",
        displayName: profileData?.full_name?.trim() || user.email || "Your account",
        schoolId: profileData?.school_id ?? null,
        schoolName: schoolName,
        advisorId: profileData?.advisor_id ?? null,
        avatarEmoji: profileData?.avatar_emoji ?? null,
        profilePictureUrl: profileData?.profile_picture_url ?? null,
        role: profileData?.role ?? "student",
        isSuperAdmin: profileData?.is_super_admin ?? false,
      });
      setOptions(accountOptions);
      setReady(true);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready || !profile) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="page-shell py-10 sm:py-12">
      <div className="page-content animate-fade-in mx-auto">
        {isAdmin ? (
          <AdvisorAccountForm
            userId={profile.userId}
            email={profile.email}
            fullName={profile.fullName}
            displayName={profile.displayName}
            schoolId={profile.schoolId}
            schoolName={profile.schoolName}
            avatarEmoji={profile.avatarEmoji}
            profilePictureUrl={profile.profilePictureUrl}
            isSuperAdmin={profile.isSuperAdmin}
          />
        ) : (
          <AccountForm
            userId={profile.userId}
            email={profile.email}
            fullName={profile.fullName}
            displayName={profile.displayName}
            schoolId={profile.schoolId}
            advisorId={profile.advisorId}
            avatarEmoji={profile.avatarEmoji}
            schools={options.schools}
            advisors={options.advisors}
          />
        )}

        <p className="mt-8 text-center text-[15px] text-muted">
          <Link href={withBasePath(isAdmin ? "/admin" : "/")} className="font-medium text-primary">
            Back to {isAdmin ? "dashboard" : "home"}
          </Link>
        </p>
      </div>
    </div>
  );
}
