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
        <p className="mb-8 text-[16px] leading-relaxed text-muted">
          {completed
            ? "Your career assessment is complete. Continue with My Path."
            : "Pick up where you left off."}
        </p>

        <div className="mx-auto max-w-md space-y-6">
          <div className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)]">
            <h2 className="mb-2 text-[17px] font-semibold">Part 1: LifePath Career Assessment</h2>
            <p className="mb-4 text-[14px] text-muted">
              Discover your strongest career paths across nine LifePath areas.
            </p>
            <Link
              href={withBasePath(completed ? "/results" : "/assessment")}
              className="btn-primary block"
            >
              {completed ? "View Part 1 Results" : "Continue Part 1"}
            </Link>
          </div>

          {completed && (
            <div className="rounded-[20px] bg-card p-5 shadow-[var(--shadow)]">
              <h2 className="mb-2 text-[17px] font-semibold">Part 2: My Path After High School</h2>
              <p className="mb-4 text-[14px] text-muted">
                Get personalized post-secondary route recommendations and next steps.
              </p>
              <Link href={withBasePath("/part2")} className="btn-secondary block">
                Go to My Path
              </Link>
            </div>
          )}
        </div>

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
