// Role routing — one source of truth for where each role lives.
// Used by middleware, the API routes and every client redirect.

export type Role = "STUDENT" | "TEACHER" | "ADMIN";

/** The workspace path each role calls home. */
export function roleHome(role: string | undefined | null): string {
  switch (role) {
    case "TEACHER":
      return "/teacher";
    case "ADMIN":
      return "/admin";
    default:
      return "/student";
  }
}

/**
 * Only allow same-origin relative paths as redirect targets.
 * Blocks "//evil.com", "https://…", "\\…" and control characters.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  if (/[\r\n\u0000]/.test(next)) return null;
  if (next.startsWith("/api/")) return null;
  return next;
}

/** The login entry points — /login, /login/student, /login/teacher, /login/admin. */
export const LOGIN_ROLES = ["student", "teacher", "admin"] as const;
export type LoginRole = (typeof LOGIN_ROLES)[number];

export function normalizeLoginRole(
  value: string | undefined | null
): LoginRole | null {
  if (!value) return null;
  const v = value.toLowerCase();
  return (LOGIN_ROLES as readonly string[]).includes(v) ? (v as LoginRole) : null;
}

export function loginRoleToRole(r: LoginRole): Role {
  return r === "student" ? "STUDENT" : r === "teacher" ? "TEACHER" : "ADMIN";
}

export function roleToLoginRole(r: string): LoginRole {
  return r === "TEACHER" ? "teacher" : r === "ADMIN" ? "admin" : "student";
}

/** Path → expected role. Returns null for non-workspace paths. */
export function roleForPath(pathname: string): Role | null {
  if (pathname.startsWith("/student")) return "STUDENT";
  if (pathname.startsWith("/teacher")) return "TEACHER";
  if (pathname.startsWith("/admin")) return "ADMIN";
  return null;
}
