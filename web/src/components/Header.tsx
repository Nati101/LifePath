"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileMenu from "@/components/ProfileMenu";
import { normalizeAvatar } from "@/lib/avatars";
import { getAuthenticatedUser } from "@/lib/auth/guards";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function Header() {
  const [userState, setUserState] = useState<{
    role: string | null;
    fullName: string | null;
    avatarEmoji: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const user = await getAuthenticatedUser(supabase);

      if (!user) {
        if (!cancelled) setUserState(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_emoji")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setUserState({
          role: profile?.role ?? null,
          fullName: profile?.full_name ?? null,
          avatarEmoji: profile?.avatar_emoji ?? null,
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = userState?.fullName?.trim() || "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href={withBasePath("/")} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-foreground">
            LifePath
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {userState ? (
            <>
              <Link
                href={withBasePath("/assessment")}
                className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
              >
                Sections
              </Link>
              {userState.role === "admin" && (
                <Link
                  href={withBasePath("/admin")}
                  className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
                >
                  Admin
                </Link>
              )}
              <ProfileMenu
                avatarEmoji={normalizeAvatar(userState.avatarEmoji)}
                displayName={displayName}
                settingsHref={withBasePath("/account")}
                signOutHref={withBasePath("/auth/signout")}
              />
            </>
          ) : (
            <>
              <Link
                href={withBasePath("/login")}
                className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link href={withBasePath("/register")} className="btn-secondary-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
