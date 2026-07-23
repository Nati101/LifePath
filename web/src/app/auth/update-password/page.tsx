"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthBrandMark from "@/components/AuthBrandMark";
import {
  MIN_PASSWORD_LENGTH,
  passwordHint,
  validatePassword,
} from "@/lib/auth/password";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setHasSession(Boolean(session));
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setHasSession(Boolean(session));
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push(withBasePath("/assessment"));
    router.refresh();
  };

  if (!ready) {
    return (
      <div className="page-shell centered">
        <p className="text-[15px] text-muted">Loading…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="page-shell centered">
        <div className="page-content animate-fade-in text-center">
          <AuthBrandMark />
          <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-foreground">
            Link expired
          </h1>
          <p className="mx-auto mb-8 max-w-[320px] text-[15px] leading-relaxed text-muted">
            This password reset link is invalid or has expired. Request a new one
            to continue.
          </p>
          <Link href={withBasePath("/forgot-password")} className="btn-primary">
            Reset password
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
          Choose a new password
        </h1>
        <p className="mx-auto mb-8 max-w-[320px] text-center text-[15px] leading-relaxed text-muted">
          Then you can get back to your LifePath assessment.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <label htmlFor="new-password" className="field-label">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder="Create a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <p className="field-hint">{passwordHint()}</p>
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password" className="field-label">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="pt-1 text-center text-[14px] text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
