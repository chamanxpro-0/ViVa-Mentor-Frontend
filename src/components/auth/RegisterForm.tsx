// RegisterForm — create a student or faculty account.
// Administration seats are provisioned internally, never self-registered —
// that is standard practice for a platform that watches over exam data.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import { roleHome } from "@/lib/roles";
import { AuthError, AuthSwitch, FIELD_CLASS, Field, SubmitButton } from "./pieces";

type SignupRole = "STUDENT" | "TEACHER";

const ROLE_CARDS: { role: SignupRole; title: string; line: string }[] = [
  {
    role: "STUDENT",
    title: "Student",
    line: "Rehearse vivas and interviews, earn badges, hold a streak.",
  },
  {
    role: "TEACHER",
    title: "Faculty",
    line: "Publish question banks, watch class analytics, calibrate marks.",
  },
];

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>("STUDENT");
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    goal: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        department: form.department.trim() || undefined,
        goal: form.goal.trim() || undefined,
      };
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
      await useApp.getState().refreshMe();
      router.replace(roleHome(role));
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Registration failed — please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-brass)]">
        Create account
      </p>
      <h1 className="mt-4 font-display text-[1.85rem] leading-[1.12] tracking-tight">
        Take a seat in the practice room.
      </h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--vl-chalk)]/55">
        Free for students and faculty. Your first session can start two minutes
        from now.
      </p>

      {/* seat selection */}
      <div className="mt-7 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="I am joining as">
        {ROLE_CARDS.map((c) => {
          const active = role === c.role;
          return (
            <button
              key={c.role}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(c.role)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-[var(--vl-brass)]/70 bg-[var(--vl-brass)]/[0.07]"
                  : "border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/50 hover:border-[var(--vl-chalk)]/30"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-display text-[15px]">{c.title}</span>
                <span
                  className={`h-2 w-2 rounded-full transition-colors ${
                    active ? "bg-[var(--vl-brass)]" : "bg-[var(--vl-chalk)]/20"
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--vl-chalk)]/50">
                {c.line}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="su-name">
            <input
              id="su-name"
              required
              minLength={2}
              autoComplete="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={FIELD_CLASS}
              placeholder="Ayesha Khan"
            />
          </Field>
          <Field label="Department" htmlFor="su-dept" hint="optional">
            <input
              id="su-dept"
              autoComplete="organization"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              className={FIELD_CLASS}
              placeholder="Computer Science"
            />
          </Field>
        </div>

        <Field label="Email" htmlFor="su-email">
          <input
            id="su-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={FIELD_CLASS}
            placeholder="you@university.edu"
          />
        </Field>

        <Field
          label="Password"
          hint="min 8 characters"
          htmlFor="su-password"
        >
          <input
            id="su-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className={FIELD_CLASS}
            placeholder="••••••••"
          />
        </Field>

        <Field
          label="Your goal"
          hint="optional"
          htmlFor="su-goal"
        >
          <input
            id="su-goal"
            value={form.goal}
            onChange={(e) => set("goal", e.target.value)}
            className={FIELD_CLASS}
            placeholder={role === "STUDENT" ? "Clear the DBMS viva" : "Prepare my class for externals"}
          />
        </Field>

        {role === "TEACHER" && (
          <p className="rounded-lg border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/60 px-3.5 py-2.5 text-[12px] leading-relaxed text-[var(--vl-chalk)]/50">
            Faculty accounts can publish to the shared question bank and view
            class analytics. Administration seats are provisioned internally
            and never self-registered.
          </p>
        )}

        <AuthError message={error} />

        <SubmitButton busy={busy} label="Create account" busyLabel="Preparing your room…" />
      </form>

      <AuthSwitch mode="register" />

      <p className="mt-4 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--vl-chalk)]/35">
        Answers are scored in text · voice never leaves your browser
      </p>
    </div>
  );
}
