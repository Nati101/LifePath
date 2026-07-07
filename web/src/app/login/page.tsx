"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { createClient, withBasePath } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  useRedirectIfAuthenticated("/assessment");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(withBasePath("/assessment"));
    router.refresh();
  };

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in">
        <h1 className="mb-8 text-center text-[28px] font-semibold tracking-tight text-foreground">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />

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
