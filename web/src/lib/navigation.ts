import { getBasePath } from "@/lib/supabase/client";

export const AUTH_PATHS = ["/login", "/register"] as const;

export function normalizeAppPath(pathname: string): string {
  const base = getBasePath();
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
}

export function isAuthPage(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return AUTH_PATHS.some((authPath) => path === authPath || path.startsWith(`${authPath}/`));
}

export function isProtectedPage(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return (
    path.startsWith("/assessment") ||
    path.startsWith("/account") ||
    path.startsWith("/results") ||
    path.startsWith("/admin")
  );
}
