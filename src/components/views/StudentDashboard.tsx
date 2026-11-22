// Student Dashboard — the classroom. A chalkboard for readiness, a timetable
// for today, a report card for stats, a notebook for session history.
// (Same data & interactions as before — spec §7 Student Dashboard.)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReadinessGauge from "@/components/ReadinessGauge";
import { PERSONA_LABELS, MODE_LABELS, type Mode, type PersonaId } from "@/lib/types";

interface ProgressData {
  streak: number;
  xp: number;
  trend: { date: string; score: number; subject: string; sessionId: string }[];
  readiness: {
    subjectId: string;
    subject: string;
    index: number;
    band: "red" | "amber" | "green";
    topFixes: { topic: string; contribution: number; effectiveStrength: number }[];
  }[];
  recommended: { topic: string; subject: string; strength: number; attempts: number }[];
  sessionCount: number;
  avgScore: number | null;
}

interface SessionsData {
  sessions: {
    id: string;
    mode: string;
    persona: string;
    subject: string;
    status: string;
    totalScore: number | null;
    startedAt: string;
    delivery: { avgWpm: number; fillerPerMin: number; pauses: number } | null;
  }[];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function StudentDashboard() {
  const { me, setView, sessionEnded } = useApp();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [sessions, setSessions] = useState<SessionsData["sessions"] | null>(null);

  useEffect(() => {
    void api<ProgressData>("/api/progress/me").then(setProgress).catch(() => setProgress(null));
    void api<SessionsData>("/api/sessions").then((d) => setSessions(d.sessions)).catch(() => setSessions(null));
  }, [sessionEnded]);

  if (!me) return null;
  const dueCards = me.dueCards;
  const recent = (sessions ?? []).slice(0, 6);
  const primaryReadiness = progress?.readiness.find((r) => r.subject === "DBMS") ?? progress?.readiness[0];

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------- masthead */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {greeting()}, scholar
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight md:text-5xl">
            {me.user.name.split(" ")[0]}&apos;s classroom
          </h1>
          <p className="mt-3 -rotate-1 font-chalk text-xl text-primary">
            {me.user.goal
              ? `“${me.user.goal}” — one session at a time.`
              : "practice out loud — that's where vivas are won."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setView("setup")}
            className="h-11 rounded-none px-6 text-[12px] font-semibold uppercase tracking-[0.14em]"
          >
            Start mock session →
          </Button>
          <Button
            variant="outline"
            onClick={() => setView("revision")}
            className="h-11 rounded-none border-2 border-dashed px-5 text-[12px] font-semibold uppercase tracking-[0.14em]"
          >
            Revision{dueCards > 0 ? ` · ${dueCards} due` : ""}
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------- board + timetable */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* the chalkboard */}
        <section className="vm-chalkboard p-7 md:p-9" aria-label="Viva readiness index">
          <div className="relative z-[1]">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#f1ecdd]/20 pb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#f1ecdd]/60">
                today&apos;s board — viva readiness
              </p>
              <p className="font-chalk text-lg text-[#e8d9a8]">
                100 × Σ(weight × strength ÷ 10)
              </p>
            </div>

            {primaryReadiness ? (
              <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row">
                <div
                  style={
                    {
                      "--foreground": "#f1ecdd",
                      "--muted": "rgba(241,236,221,0.28)",
                    } as React.CSSProperties
                  }
                >
                  <ReadinessGauge index={primaryReadiness.index} band={primaryReadiness.band} />
                </div>

                <div className="w-full flex-1">
                  <p className="font-chalk text-2xl text-[#f1ecdd]">
                    {primaryReadiness.subject} — fix these first:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {primaryReadiness.topFixes.length === 0 && (
                      <li className="font-chalk text-xl text-[#e8d9a8]">
                        everything looks strong — try a harder difficulty!
                      </li>
                    )}
                    {primaryReadiness.topFixes.map((t, i) => (
                      <li key={t.topic}>
                        <button
                          onClick={() => setView("setup")}
                          className="group flex w-full items-baseline justify-between gap-3 text-left"
                        >
                          <span className="vm-chalk-text font-chalk text-[22px]">
                            {String(i + 1).padStart(2, "0")}. {t.topic}
                            <span className="ml-2 inline-block h-px w-10 bg-[#e8d9a8]/70 align-middle transition-all duration-300 group-hover:w-16 group-hover:bg-[#e8d9a8]" />
                          </span>
                          <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-[#f1ecdd]/75">
                            str {t.effectiveStrength.toFixed(1)} · +{Math.round(t.contribution * 100)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {progress && progress.readiness.length > 1 && (
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-[#f1ecdd]/15 pt-4">
                      {progress.readiness.map((r) => (
                        <span
                          key={r.subjectId}
                          className="rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest"
                          style={{
                            borderColor:
                              r.band === "green"
                                ? "rgba(143,188,143,.5)"
                                : r.band === "amber"
                                  ? "rgba(232,217,168,.5)"
                                  : "rgba(224,131,114,.5)",
                            color:
                              r.band === "green" ? "#b9d9b9" : r.band === "amber" ? "#e8d9a8" : "#e8b3a6",
                          }}
                        >
                          {r.subject} · {r.index}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <span className="grid h-24 w-24 place-items-center rounded-full border-2 border-dashed border-[#f1ecdd]/30">
                  <span className="font-display text-3xl text-[#f1ecdd]/50">?</span>
                </span>
                <p className="font-chalk text-2xl text-[#f1ecdd]">
                  complete your first session to unlock the board
                </p>
              </div>
            )}
          </div>
        </section>

        {/* today's timetable */}
        <section className="flex flex-col gap-4" aria-label="Today">
          <div className="rounded-sm border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                today&apos;s timetable
              </p>
            </div>
            <div className="divide-y divide-border">
              <button
                onClick={() => setView("revision")}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  per 1
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Revision</span>
                  <span className="block text-xs text-muted-foreground">
                    spaced repetition keeps what you fixed
                  </span>
                </span>
                <span className="font-display text-2xl text-primary">{dueCards}</span>
              </button>

              <button
                onClick={() => setView("setup")}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  per 2
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Practice viva</span>
                  <span className="block text-xs text-muted-foreground">
                    pick mode, subject, topics &amp; persona
                  </span>
                </span>
                <span className="text-primary transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>

              <div className="flex items-center gap-4 px-5 py-4">
                <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  fuel
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">AI calls</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {me.aiUsed} / {me.user.dailyAiLimit}
                    </span>
                  </span>
                  <span className="mt-2 block h-1.5 bg-muted">
                    <span
                      className="block h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (me.aiUsed / Math.max(1, me.user.dailyAiLimit)) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* report card */}
          <div className="vm-ruled relative flex-1 overflow-hidden rounded-sm border border-border">
            <div className="relative z-[1] grid grid-cols-3 gap-px pt-5">
              {[
                [progress?.streak ?? me.user.streak, "day streak"],
                [progress?.xp ?? me.user.xp, "xp earned"],
                [progress?.avgScore ?? "—", "avg score"],
              ].map(([v, l]) => (
                <div key={l as string} className="border-l-2 border-primary/50 pl-3">
                  <p className="font-display text-3xl leading-none">{v}</p>
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {l}
                  </p>
                </div>
              ))}
            </div>
            <p className="relative z-[1] px-5 pb-4 pt-5 font-chalk text-lg text-primary">
              {progress?.sessionCount
                ? `${progress.sessionCount} sessions on record — keep the streak alive.`
                : "no marks yet — the first session writes the first line."}
            </p>
          </div>
        </section>
      </div>

      {/* ---------------------------------------------- notebook: recent sessions */}
      <section className="vm-ruled relative overflow-hidden rounded-sm border border-border" aria-label="Recent sessions">
        <div className="relative z-[1]">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-card px-5 py-3.5 pl-[68px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              practice register — recent sessions
            </p>
            <p className="font-chalk text-lg text-primary">say it out loud, every time</p>
          </div>

          {!sessions ? (
            <div className="space-y-2 bg-card p-5 pl-[68px]">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-card px-5 py-10 pl-[68px] text-center">
              <p className="font-chalk text-2xl text-primary">a fresh notebook — start session one.</p>
            </div>
          ) : (
            <div className="bg-card">
              {recent.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 px-5 py-3.5 pl-[68px] last:border-0"
                >
                  <span className="w-14 shrink-0 font-mono text-[10px] uppercase leading-tight tracking-widest text-muted-foreground">
                    {new Date(s.startedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <span className="grid h-10 w-10 shrink-0 -rotate-3 place-items-center rounded-full border-[1.5px] border-primary/70 font-display text-sm text-primary">
                    {s.totalScore != null ? s.totalScore.toFixed(1) : "—"}
                  </span>

                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-medium">
                      {s.subject} · {MODE_LABELS[s.mode as Mode] ?? s.mode}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {PERSONA_LABELS[s.persona as PersonaId] ?? s.persona}
                      {s.delivery ? ` · ${s.delivery.avgWpm} wpm avg` : ""}
                    </span>
                  </span>

                  {s.status === "completed" ? (
                    <button
                      onClick={() => useApp.getState().openReport(s.id)}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
                    >
                      report →
                    </button>
                  ) : (
                    <button
                      onClick={() => useApp.getState().startInterview(s.id)}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
                    >
                      resume →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------- index cards: recommended */}
      {progress && progress.recommended.length > 0 && (
        <section aria-label="Recommended topics">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              recommended — your weakest topics, same weighting the examiner uses
            </p>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {progress.recommended.map((r, i) => (
              <Link
                key={`${r.subject}-${r.topic}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setView("setup");
                }}
                className="group relative block rounded-sm border border-border bg-card p-5 pt-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgba(35,38,31,0.35)]"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (0.4 + (i % 3) * 0.25)}deg)` }}
              >
                {/* tape */}
                <span
                  className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 bg-primary/15 backdrop-blur-[1px]"
                  style={{ clipPath: "polygon(4% 0, 96% 4%, 100% 96%, 0 100%)" }}
                  aria-hidden="true"
                />
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {r.subject}
                </p>
                <p className="mt-1.5 font-display text-lg leading-tight">{r.topic}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-1.5 flex-1 bg-muted">
                    <span
                      className="block h-full bg-primary/80"
                      style={{ width: `${(r.strength / 10) * 100}%` }}
                    />
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{r.strength}/10</span>
                </div>
                <p className="mt-3 font-chalk text-base text-primary">
                  practice this one →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
