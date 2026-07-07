import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  return `${base}${path}`;
}
