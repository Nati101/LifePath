import Link from "next/link";
import { withBasePath } from "@/lib/supabase/client";

export default function GuestLanding() {
  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <span className="h-5 w-5 rounded-full bg-white" />
        </div>

        <h1 className="mb-3 text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          LifePath Career Exploration
        </h1>
        <p className="mx-auto mb-10 max-w-[340px] text-[16px] leading-relaxed text-muted">
          Discover career paths that match what you enjoy, what you&apos;re good
          at, and what motivates you.
        </p>

        <div className="surface-card mb-10 px-6 py-6 text-left">
          <p className="mb-4 text-[13px] font-semibold text-foreground">
            Test guidelines
          </p>
          <ul className="space-y-3.5 text-[15px] leading-snug text-muted">
            <li>Answer honestly — there are no right or wrong answers.</li>
            <li>Four short sections, about 15 minutes total.</li>
            <li>Your progress saves automatically.</li>
          </ul>
        </div>

        <Link href={withBasePath("/register")} className="btn-primary">
          Get started
        </Link>

        <p className="mt-6 text-[15px] text-muted">
          Already have an account?{" "}
          <Link
            href={withBasePath("/login")}
            className="font-semibold text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
