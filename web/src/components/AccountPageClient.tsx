"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountForm from "@/components/AccountForm";
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
    advisorId: string | null;
    avatarEmoji: string | null;
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

      const [{ data: profileData }, accountOptions] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email, school_id, advisor_id, avatar_emoji")
          .eq("id", user.id)
          .single(),
        getAccountOptions(supabase, user.id),
      ]);

      if (cancelled) return;

      setProfile({
        userId: user.id,
        email: profileData?.email ?? user.email ?? "",
        fullName: profileData?.full_name ?? "",
        displayName: profileData?.full_name?.trim() || user.email || "Your account",
        schoolId: profileData?.school_id ?? null,
        advisorId: profileData?.advisor_id ?? null,
        avatarEmoji: profileData?.avatar_emoji ?? null,
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

  return (
    <div className="page-shell py-10 sm:py-12">
      <div className="page-content animate-fade-in mx-auto">
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

        <p className="mt-8 text-center text-[15px] text-muted">
          <Link href={withBasePath("/")} className="font-medium text-primary">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
