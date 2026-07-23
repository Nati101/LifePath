"use client";

import Link from "next/link";
import { useState } from "react";
import AuthBrandMark from "@/components/AuthBrandMark";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { getAuthCallbackUrl } from "@/lib/supabase/env";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  useRedirectIfAuthenticated();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl("/auth/update-password"),
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="page-shell centered">
        <div className="page-content animate-fade-in text-center">
          <AuthBrandMark />
          <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mx-auto mb-8 max-w-[340px] text-[15px] leading-relaxed text-muted">
            If an account exists for <span className="font-medium text-foreground">{email}</span>,
            we sent a link to reset your password.
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
          Reset password
        </h1>
        <p className="mx-auto mb-8 max-w-[320px] text-center text-[15px] leading-relaxed text-muted">
          Enter your email and we&apos;ll send a link to choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <label htmlFor="forgot-email" className="field-label">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="pt-1 text-center text-[14px] text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-muted">
          <Link href={withBasePath("/login")} className="font-semibold text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
