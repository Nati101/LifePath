import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Browser Supabase client for the static/SPA app (GitHub Pages).
 * Uses localStorage via @supabase/supabase-js — @supabase/ssr cookie storage
 * is unreliable on static hosting with no server middleware.
 */
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return browserClient;
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

/** Paths for Next.js Link / router (basePath is applied automatically). */
export function withBasePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Full path including basePath for hard navigations (window.location).
 * Adds a trailing slash when deploying under a base path (static export).
 */
export function appPath(path: string): string {
  const base = getBasePath().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (!base) return normalized;

  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return `${base}${withSlash}`;
}
