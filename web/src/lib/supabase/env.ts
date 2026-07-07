export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  return url;
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
