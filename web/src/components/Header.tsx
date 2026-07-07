import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { withBasePath } from "@/lib/supabase/client";
import ProfileMenu from "@/components/ProfileMenu";
import { normalizeAvatar } from "@/lib/avatars";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let fullName: string | null = null;
  let avatarEmoji: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_emoji")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
    fullName = profile?.full_name ?? null;
    avatarEmoji = profile?.avatar_emoji ?? null;
  }

  const displayName = fullName?.trim() || "Account";

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

        {user ? (
          <nav className="flex items-center gap-1 text-[14px] font-medium text-muted sm:gap-2">
            {role === "admin" && (
              <Link
                href={withBasePath("/admin")}
                className="hidden px-3 py-2 transition-colors hover:text-foreground sm:inline"
              >
                Admin
              </Link>
            )}
            <Link
              href={withBasePath("/assessment")}
              className="px-3 py-2 transition-colors hover:text-foreground"
            >
              Sections
            </Link>
            <ProfileMenu
              avatarEmoji={normalizeAvatar(avatarEmoji)}
              displayName={displayName}
              settingsHref={withBasePath("/account")}
              signOutAction={withBasePath("/auth/signout")}
            />
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href={withBasePath("/login")}
              className="px-2 py-2 text-[14px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link href={withBasePath("/register")} className="btn-primary-sm">
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
