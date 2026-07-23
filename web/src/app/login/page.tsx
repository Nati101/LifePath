"use client";

import Link from "next/link";
import { useState } from "react";
import AuthBrandMark from "@/components/AuthBrandMark";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { appPath, createClient, withBasePath } from "@/lib/supabase/client";

export default function LoginPage() {
  useRedirectIfAuthenticated("/assessment");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Hard navigation: soft router.push/refresh can hang on static GitHub Pages.
      window.location.assign(appPath("/assessment"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in">
        <AuthBrandMark />
        <h1 className="mb-2 text-center text-[28px] font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mx-auto mb-8 max-w-[320px] text-center text-[15px] leading-relaxed text-muted">
          Pick up your LifePath career assessment where you left off.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <label htmlFor="login-email" className="field-label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-field">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="field-label mb-0">
                Password
              </label>
              <Link
                href={withBasePath("/forgot-password")}
                className="text-[13px] font-medium text-muted transition-colors hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="pt-1 text-center text-[14px] text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-muted">
          No account?{" "}
          <Link href={withBasePath("/register")} className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
