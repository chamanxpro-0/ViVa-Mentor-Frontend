// LoginForm — the single sign-in gate for every role.
// The URL states the audience (/login/student, /login/teacher, /login/admin)
// and the tab switch keeps the address in sync, so each seat has a
// shareable, bookmarkable entry. After sign-in the visitor is routed to the
// workspace their account belongs to — credentials decide the destination,
// never the page they came from.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import {
  LOGIN_ROLES,
  type LoginRole,
  roleHome,
  safeNext,
} from "@/lib/roles";
import { AuthError, AuthSwitch, FIELD_CLASS, Field, SubmitButton } from "./pieces";

const ROLE_COPY: Record<LoginRole, { tab: string; heading: string; sub: string; demo: [string, string] }> = {
  student: {
    tab: "Student",
    heading: "Welcome back to the classroom.",
    sub: "Sign in to continue your practice — your streak has been waiting.",
    demo: ["student@vivamentor.edu", "Study@123"],
  },
  teacher: {
    tab: "Faculty",
    heading: "Welcome back, faculty.",
    sub: "Sign in to review classes, calibrate marks and tend the question bank.",
    demo: ["teacher@vivamentor.edu", "Teach@1234"],
  },
  admin: {
    tab: "Administration",
    heading: "Control room access.",
    sub: "Sign in to oversee platform health, seats and AI usage limits.",
    demo: ["admin@vivamentor.edu", "Admin@123"],
  },
};

export default function LoginForm({ initialRole }: { initialRole: LoginRole }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [role, setRole] = useState<LoginRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = ROLE_COPY[role];

  function switchRole(r: LoginRole) {
    setRole(r);
    setError(null);
    // keep the address honest — each role's entry is its own URL
    router.replace(next ? `/login/${r}?next=${encodeURIComponent(next)}` : `/login/${r}`, {
      scroll: false,
    });
  }

  async function authenticate(emailValue: string, passwordValue: string): Promise<string> {
    const data = await api<{ user: { role: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailValue, password: passwordValue }),
    });
    // Hydrate the client store immediately, including after a prior sign-out.
    await useApp.getState().refreshMe();
    // the account's role decides the destination; a validated `next`
    // (deep link into a specific page) is honoured when present
    return next ?? roleHome(data.user.role);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const dest = await authenticate(email, password);
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Sign in failed — please try again.");
      setBusy(false);
    }
  }

  // one click — straight into the demo seat; no form filling needed
  async function enterDemo() {
    setBusy(true);
    setError(null);
    setEmail(copy.demo[0]);
    setPassword(copy.demo[1]);
    try {
      const dest = await authenticate(copy.demo[0], copy.demo[1]);
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Demo unavailable — credentials are prefilled, try Sign in.");
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-brass)]">
        Sign in
      </p>
      <h1 className="mt-4 font-display text-[1.85rem] leading-[1.12] tracking-tight">
        {copy.heading}
      </h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--vl-chalk)]/55">{copy.sub}</p>
      <p className="mt-3 rounded-md border border-[var(--vl-brass)]/25 bg-[var(--vl-brass)]/[0.06] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--vl-chalk)]/55">
        Frontend demo · local browser storage · simulated scoring
      </p>

      {/* role tabs — the audience, not a permission */}
      <div className="mt-7 flex gap-5 border-b border-[var(--vl-chalk)]/12" role="tablist" aria-label="Choose your seat">
        {LOGIN_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            onClick={() => switchRole(r)}
            className={`-mb-px border-b-2 pb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors ${
              role === r
                ? "border-[var(--vl-brass)] text-[var(--vl-brass)]"
                : "border-transparent text-[var(--vl-chalk)]/40 hover:text-[var(--vl-chalk)]/75"
            }`}
          >
            {ROLE_COPY[r].tab}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <Field label="Email" htmlFor="login-email">
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD_CLASS}
            placeholder="you@university.edu"
          />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={FIELD_CLASS}
            placeholder="••••••••"
          />
        </Field>

        <AuthError message={error} />

        <SubmitButton busy={busy} label="Sign in" busyLabel="Opening your workspace…" />
      </form>

      {/* one-click demo — a full sign-in, same check as any real account */}
      <button
        type="button"
        onClick={enterDemo}
        disabled={busy}
        className="group mt-5 flex w-full items-center justify-between rounded-lg border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/60 px-4 py-3 text-left transition-colors hover:border-[var(--vl-brass)]/45 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>
          <span className="block text-[12.5px] font-medium text-[var(--vl-chalk)]/75">
            {busy ? "Signing you in…" : `Enter the ${ROLE_COPY[role].tab.toLowerCase()} demo`}
          </span>
          <span className="mt-0.5 block font-mono text-[10.5px] text-[var(--vl-chalk)]/45">
            {copy.demo[0]} · one click, live data inside
          </span>
        </span>
        <span className="shrink-0 self-center whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--vl-brass)]">
          {busy ? "···" : "step in →"}
        </span>
      </button>

      <AuthSwitch mode="login" />

      <p className="mt-4 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--vl-chalk)]/35">
        Free for students and faculty · voice stays in your browser
      </p>

      <p className="mt-6 text-center">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/40 transition-colors hover:text-[var(--vl-chalk)]/70"
        >
          ← back to vivamentor.edu
        </Link>
      </p>
    </div>
  );
}
