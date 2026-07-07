"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileMenu from "@/components/ProfileMenu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { normalizeAvatar } from "@/lib/avatars";
import { isAuthPage, normalizeAppPath } from "@/lib/navigation";
import { withBasePath } from "@/lib/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const onAuthPage = isAuthPage(pathname);
  const appPath = normalizeAppPath(pathname);
  const showAuthenticatedNav = Boolean(user) && !onAuthPage;
  const displayName = user?.fullName?.trim() || "Account";

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
          {isLoading ? (
            <span className="h-9 w-24" aria-hidden />
          ) : showAuthenticatedNav ? (
            <>
              <Link
                href={withBasePath("/assessment")}
                className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
              >
                Sections
              </Link>
              {user?.role === "admin" && (
                <Link
                  href={withBasePath("/admin")}
                  className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
                >
                  Admin
                </Link>
              )}
              <ProfileMenu
                avatarEmoji={normalizeAvatar(user?.avatarEmoji)}
                displayName={displayName}
                settingsHref={withBasePath("/account")}
                signOutHref={withBasePath("/auth/signout")}
              />
            </>
          ) : onAuthPage ? (
            appPath.startsWith("/login") ? (
              <Link href={withBasePath("/register")} className="btn-secondary-sm">
                Get started
              </Link>
            ) : (
              <Link
                href={withBasePath("/login")}
                className="text-[14px] font-medium text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
            )
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
