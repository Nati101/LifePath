"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthBrandMark from "@/components/AuthBrandMark";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { MIN_PASSWORD_LENGTH, passwordHint, validatePassword } from "@/lib/auth/password";
import { ensureProfile } from "@/lib/assessment/persistence";
import { getAuthCallbackUrl } from "@/lib/supabase/env";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  useRedirectIfAuthenticated("/assessment");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl("/welcome"),
        data: { full_name: fullName, role: "student" },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNeedsConfirm(true);
      setLoading(false);
      return;
    }

    if (data.user) {
      await ensureProfile(supabase, data.user);
    }

    router.push(withBasePath("/welcome"));
    router.refresh();
  };

  if (needsConfirm) {
    return (
      <div className="page-shell centered">
        <div className="page-content animate-fade-in text-center">
          <AuthBrandMark />
          <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mx-auto mb-8 max-w-[340px] text-[15px] leading-relaxed text-muted">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            Open it to finish creating your LifePath account.
          </p>
          <Link href={withBasePath("/login")} className="btn-primary">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in">
        <AuthBrandMark />
        <h1 className="mb-2 text-center text-[28px] font-semibold tracking-tight text-foreground">
          Create account
        </h1>
        <p className="mx-auto mb-8 max-w-[340px] text-center text-[15px] leading-relaxed text-muted">
          For students ages 14–18. Save your progress and get career paths that
          match you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <label htmlFor="register-name" className="field-label">
              Full name
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email" className="field-label">
              Email
            </label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="field-label">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <p className="field-hint">{passwordHint()}</p>
          </div>

          {error && (
            <p className="pt-1 text-center text-[14px] text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Creating…" : "Get started"}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-muted">
          Already have an account?{" "}
          <Link href={withBasePath("/login")} className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
