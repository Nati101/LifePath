import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function withBasePath(path: string): string {
  // basePath is configured in next.config.ts; Next.js prefixes routes automatically.
  return path.startsWith("/") ? path : `/${path}`;
}
