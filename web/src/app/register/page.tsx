"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, withBasePath } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/assessment/persistence";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "student" },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await ensureProfile(supabase, user);
    }

    router.push(withBasePath("/assessment"));
    router.refresh();
  };

  return (
    <div className="page-shell centered">
      <div className="page-content animate-fade-in">
        <h1 className="mb-8 text-center text-[28px] font-semibold tracking-tight text-foreground">
          Create account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
          />
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
            minLength={6}
            autoComplete="new-password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />

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
