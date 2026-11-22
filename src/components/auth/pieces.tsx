// Shared field + chrome primitives for the auth forms.
// One visual voice across /login and /register.

import Link from "next/link";

export const FIELD_CLASS =
  "h-11 w-full rounded-lg border border-[var(--vl-chalk)]/22 bg-[var(--vl-chalk)]/[0.06] px-3.5 text-sm text-[var(--vl-chalk)] outline-none transition-colors placeholder:text-[var(--vl-chalk)]/30 focus-visible:border-[var(--vl-brass)] focus-visible:ring-2 focus-visible:ring-[var(--vl-brass)]/25";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/55"
        >
          {label}
        </label>
        {hint && (
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--vl-chalk)]/35">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-[var(--vl-red)]/35 bg-[var(--vl-red)]/10 px-3.5 py-2.5 text-[13px] leading-snug text-[var(--vl-red)]"
    >
      {message}
    </p>
  );
}

export function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="group relative h-12 w-full overflow-hidden rounded-lg bg-[var(--vl-brass)] text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--vl-bg)] transition-colors hover:bg-[var(--vl-brass-hi)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="relative z-10">{busy ? busyLabel : label}</span>
    </button>
  );
}

export function AuthSwitch({ mode }: { mode: "login" | "register" }) {
  return (
    <p className="mt-7 text-center text-[13px] text-[var(--vl-chalk)]/50">
      {mode === "login" ? (
        <>
          New to VivaMentor?{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--vl-brass)] underline-offset-4 transition-colors hover:text-[var(--vl-brass-hi)] hover:underline"
          >
            Create an account
          </Link>
        </>
      ) : (
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--vl-brass)] underline-offset-4 transition-colors hover:text-[var(--vl-brass-hi)] hover:underline"
          >
            Sign in
          </Link>
        </>
      )}
    </p>
  );
}
