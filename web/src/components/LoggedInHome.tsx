import Link from "next/link";
import { withBasePath } from "@/lib/supabase/client";
import ProfileAvatar from "@/components/ProfileAvatar";
import { normalizeAvatar } from "@/lib/avatars";

interface LoggedInHomeProps {
  fullName: string | null;
  sessionStatus: string | null;
  isAdmin: boolean;
  avatarEmoji?: string | null;
}

export default function LoggedInHome({
  fullName,
  sessionStatus,
  isAdmin,
  avatarEmoji,
}: LoggedInHomeProps) {
  const completed = sessionStatus === "completed";
  const firstName = fullName?.split(" ")[0];

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in text-center">
        <ProfileAvatar
          emoji={normalizeAvatar(avatarEmoji)}
          size="lg"
          className="mx-auto mb-4"
        />
        <h1 className="mb-3 text-[28px] font-semibold tracking-tight text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mb-10 text-[16px] leading-relaxed text-muted">
          {completed
            ? "Your assessment is complete."
            : "Pick up where you left off."}
        </p>

        <Link
          href={withBasePath(completed ? "/results" : "/assessment")}
          className="btn-primary"
        >
          {completed ? "View results" : "Continue"}
        </Link>

        <div className="mt-8 flex flex-col items-center gap-4 text-[15px]">
          <Link href={withBasePath("/account")} className="font-medium text-muted">
            Edit account
          </Link>
          {isAdmin && (
            <Link href={withBasePath("/admin")} className="font-medium text-muted">
              Admin dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
