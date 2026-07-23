export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  return url;
}

/** Public origin including base path (e.g. https://nati101.github.io/LifePath). */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    return `${window.location.origin}${base}`;
  }

  return "http://localhost:3000";
}

/** Absolute callback URL for Supabase email confirm / password recovery. */
export function getAuthCallbackUrl(nextPath: string): string {
  const url = new URL(`${getSiteUrl()}/auth/callback`);
  url.searchParams.set("next", nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
  return url.toString();
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase client key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }

  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "Do not use a secret key (sb_secret_...) in NEXT_PUBLIC_ env vars. Use your publishable/anon key instead.",
    );
  }

  return key;
}
