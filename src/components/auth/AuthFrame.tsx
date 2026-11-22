// AuthFrame — the chrome shared by /login and /register.
// Same ink/paper world as the landing: the aura and the diagonal sweep of
// light carry over, so walking from the site to the sign-in feels like one
// building with two rooms. Theme follows the visitor's choice (vm-theme).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const THEME_KEY = "vm-theme";

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function Mark() {
  return (
    <span className="relative block h-4 w-4 shrink-0" aria-hidden="true">
      <span className="absolute inset-0 rotate-45 rounded-[2px] border border-[var(--vl-brass)]" />
      <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--vl-brass)]" />
    </span>
  );
}

const RAIL_POINTS: [string, string][] = [
  ["Adaptive cross-questioning", "the examiner probes the weak points instead of reading a script"],
  ["Transparent rubric scoring", "correctness, completeness, clarity and depth — no black box"],
  ["Spaced revision", "missed points return as cards until they stick"],
];

export default function AuthFrame({ children }: { children: React.ReactNode }) {
  const [day, setDay] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      /* private mode — stay on ink */
    }
    if (stored !== "day") return;
    const id = window.requestAnimationFrame(() => setDay(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const toggleTheme = useCallback(() => {
    setDay((d) => {
      const next = !d;
      try {
        localStorage.setItem(THEME_KEY, next ? "day" : "ink");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div
      className="vl-stage relative min-h-screen"
      data-mode={day ? "day" : "ink"}
      style={{ background: "var(--vl-bg)", color: "var(--vl-chalk)" }}
    >
      {/* backdrop — quiet light, the same two gradients the landing uses */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "var(--vl-aura)" }} />
        <div className="absolute inset-0" style={{ background: "var(--vl-sweep)" }} />
      </div>

      {/* top bar */}
      <header className="relative z-10 border-b border-[var(--vl-chalk)]/8">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="VivaMentor home">
            <Mark />
            <span className="font-display text-lg tracking-tight" style={{ color: "var(--vl-chalk)" }}>
              VivaMentor
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/55 transition-colors hover:text-[var(--vl-chalk)]"
            >
              Back to site
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={day}
              aria-label={day ? "Switch to dark theme" : "Switch to light theme"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--vl-chalk)]/15 text-[var(--vl-chalk)]/60 transition-colors hover:border-[var(--vl-chalk)]/35 hover:text-[var(--vl-chalk)]"
            >
              {day ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-4.25rem)] lg:grid-cols-[1.02fr_1fr]">
        {/* brand rail */}
        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--vl-chalk)]/8 px-10 py-14 lg:flex xl:px-14">
          {/* a slow diagonal light, echoing the preloader's reveal */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(128deg, transparent 34%, rgba(255, 226, 168, 0.055) 50%, transparent 66%)",
            }}
          />
          <div className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--vl-brass)]">
              AI viva &amp; interview practice
            </p>
            <h2 className="mt-7 max-w-md font-display text-[clamp(2rem,3.2vw,2.9rem)] leading-[1.08] tracking-tight">
              The room rewards the prepared.
            </h2>
            <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-[var(--vl-chalk)]/55">
              Rehearse out loud with an examiner that asks the hard follow-ups,
              scores you against a transparent rubric and plans your revision —
              for subject vivas, HR rounds and technical panels.
            </p>
          </div>

          <ul className="relative mt-14 space-y-5 border-t border-[var(--vl-chalk)]/8 pt-8">
            {RAIL_POINTS.map(([title, sub]) => (
              <li key={title} className="max-w-md">
                <p className="text-[13.5px] font-medium" style={{ color: "var(--vl-chalk)" }}>
                  {title}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--vl-chalk)]/45">{sub}</p>
              </li>
            ))}
          </ul>
        </aside>

        {/* form column */}
        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-[26.5rem]">{children}</div>
        </section>
      </main>
    </div>
  );
}
