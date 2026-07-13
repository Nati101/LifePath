"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileMenu from "@/components/ProfileMenu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { normalizeAvatar } from "@/lib/avatars";
import { isAuthPage, normalizeAppPath } from "@/lib/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const onAuthPage = isAuthPage(pathname);
  const appPath = normalizeAppPath(pathname);
  const showAuthenticatedNav = Boolean(user) && !onAuthPage;
  const displayName = user?.fullName?.trim() || "Account";
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) return;
    
    async function checkSuperAdmin() {
      if (!user) return;
      
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      if (profile?.is_super_admin) {
        setIsSuperAdmin(true);
      }
    }
    void checkSuperAdmin();
  }, [user]);

  const isActive = (path: string) => {
    if (path === "/") return appPath === "/";
    return appPath.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href={withBasePath(isAdmin ? "/admin" : "/")} className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <span className="h-3 w-3 rounded-full bg-white/95" />
          </span>
          <span className="text-[18px] font-bold tracking-tight text-foreground">
            LifePath
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {isLoading ? (
            <span className="h-9 w-32" aria-hidden />
          ) : showAuthenticatedNav ? (
            <>
              {isAdmin ? (
                // Admin Navigation
                <>
                  <Link
                    href={withBasePath("/admin")}
                    className={`nav-link ${isActive("/admin") && !appPath.includes("/admin/manage") ? "nav-link-active" : ""}`}
                  >
                    Dashboard
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      href={withBasePath("/admin/manage")}
                      className={`nav-link ${isActive("/admin/manage") ? "nav-link-active" : ""}`}
                    >
                      Manage
                    </Link>
                  )}
                </>
              ) : (
                // Student Navigation
                <>
                  <Link
                    href={withBasePath("/")}
                    className={`nav-link ${isActive("/") && !appPath.includes("/assessment") && !appPath.includes("/part2") && !appPath.includes("/account") && !appPath.includes("/results") ? "nav-link-active" : ""}`}
                  >
                    Home
                  </Link>
                  <Link
                    href={withBasePath("/assessment")}
                    className={`nav-link ${isActive("/assessment") || isActive("/results") ? "nav-link-active" : ""}`}
                  >
                    Career Paths
                  </Link>
                  <Link
                    href={withBasePath("/part2")}
                    className={`nav-link ${isActive("/part2") ? "nav-link-active" : ""}`}
                  >
                    After High School
                  </Link>
                </>
              )}
              <div className="ml-2 sm:ml-3">
                <ProfileMenu
                  avatarEmoji={normalizeAvatar(user?.avatarEmoji)}
                  displayName={displayName}
                  settingsHref={withBasePath("/account")}
                  signOutHref={withBasePath("/auth/signout")}
                />
              </div>
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
