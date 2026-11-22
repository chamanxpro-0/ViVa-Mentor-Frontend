// Admin Panel — mission control. Graphite, amber telemetry, monospace
// readouts, a live operations clock. Users, subjects, AI usage limits,
// platform statistics — same data, new console. (spec (§7)

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  users: number; teachers: number; admins: number; subjects: number;
  sessions: number; completed: number; answers: number; flashcards: number;
  aiCallsToday: number; avgSessionScore: number | null; activeThisWeek: number;
}

interface AdminUser {
  id: string; name: string; email: string; role: string; department: string | null;
  streak: number; xp: number; dailyAiLimit: number; aiUsedToday: number; createdAt: string;
}

function useClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Readout({
  value,
  label,
  note,
  tone = "amber",
}: {
  value: React.ReactNode;
  label: string;
  note?: string;
  tone?: "amber" | "green" | "plain" | "red";
}) {
  const color =
    tone === "amber" ? "text-primary" : tone === "green" ? "text-[#4ade80]" : tone === "red" ? "text-[#e06c60]" : "text-foreground";
  return (
    <div className="group relative border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        <span
          className={`h-1.5 w-1.5 rounded-full ${tone === "green" ? "bg-[#4ade80]" : tone === "red" ? "bg-[#e06c60]" : "bg-primary"} vm-dot`}
          aria-hidden="true"
        />
      </div>
      <p className={`mt-4 font-mono text-4xl font-medium leading-none tabular-nums ${color}`}>{value}</p>
      {note && <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">{note}</p>}
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
    </div>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const clock = useClock();

  useEffect(() => {
    Promise.all([
      api<Stats>("/api/admin/stats"),
      api<{ users: AdminUser[] }>("/api/admin/users"),
    ])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u.users);
      })
      .catch(() => {
        /* panel stays in skeleton state */
      });
  }, []);

  async function updateLimit(userId: string, dailyAiLimit: number) {
    try {
      await api("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ userId, dailyAiLimit }),
      });
      await load();
    } catch (err) {
      toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function load() {
    try {
      const [s, u] = await Promise.all([
        api<Stats>("/api/admin/stats"),
        api<{ users: AdminUser[] }>("/api/admin/users"),
      ]);
      setStats(s);
      setUsers(u.users);
    } catch { /* keep current */ }
  }

  if (!stats || !users) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full bg-muted/40" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 bg-muted/40" />)}
        </div>
        <Skeleton className="h-72 bg-muted/40" />
      </div>
    );
  }

  const health = stats.aiCallsToday > 0 ? "operations nominal" : "standing by";

  return (
    <div className="relative space-y-8">
      {/* scanline sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="vm-scan absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/[0.025] to-transparent" />
      </div>

      {/* command masthead */}
      <div className="vm-grid-bg relative border border-border bg-card px-6 py-7 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              system control · administration
            </p>
            <h1 className="mt-3 font-display text-4xl leading-none tracking-tight md:text-5xl">
              VivaMentor operations
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Platform health, the user roster and per-user AI usage limits — illustrative usage controls for this local frontend demo (no model calls are made).
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              console time
            </p>
            <p className="mt-2 font-mono text-3xl font-medium tabular-nums text-primary">
              {clock ?? "--:--:--"}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#4ade80]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] vm-dot" aria-hidden="true" />
              {health}
            </p>
          </div>
        </div>
      </div>

      {/* instrument cluster */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Readout value={stats.users} label="registered users" note={`${stats.teachers} teachers · ${stats.admins} admins`} />
        <Readout value={stats.subjects} label="subjects" note="with weighted topics" tone="plain" />
        <Readout value={stats.sessions} label="sessions" note={`${stats.completed} completed · avg ${stats.avgSessionScore ?? "—"}/10`} tone="plain" />
        <Readout value={stats.answers} label="answers graded" note={`${stats.flashcards} flashcards created`} tone="plain" />
        <Readout value={stats.aiCallsToday} label="ai calls today" note="metered per user · daily limits" tone="amber" />
        <Readout value={stats.activeThisWeek} label="active this week" note="distinct students practicing" tone="green" />
      </div>

      {/* operator roster */}
      <section className="border border-border bg-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-6 py-4">
          <h2 className="font-display text-2xl">The roster</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            users &amp; ai usage limits — adjust per user
          </p>
        </div>
        <div className="vm-grid-bg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-6 py-3 font-normal">User</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Streak / XP</th>
                <th className="px-4 py-3 font-normal">AI used today</th>
                <th className="px-6 py-3 font-normal">Daily limit</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const over = u.aiUsedToday >= u.dailyAiLimit;
                return (
                  <tr key={u.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/25">
                    <td className="px-6 py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`rounded-none border font-mono text-[9px] uppercase tracking-[0.18em] ${
                          u.role === "ADMIN"
                            ? "border-primary/50 text-primary"
                            : u.role === "TEACHER"
                              ? "border-[#60a5fa]/40 text-[#60a5fa]"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {u.role.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                      {u.streak}d · {u.xp}xp
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-1.5 w-16 gap-[2px] overflow-hidden">
                          {Array.from({ length: 8 }).map((_, i) => {
                            const filled = (u.aiUsedToday / Math.max(1, u.dailyAiLimit)) * 8 > i;
                            return (
                              <span
                                key={i}
                                className={`h-full w-1.5 ${filled ? (over ? "bg-[#e06c60]" : "bg-primary") : "bg-muted-foreground/30"}`}
                              />
                            );
                          })}
                        </span>
                        <span className={`font-mono text-xs tabular-nums ${over ? "text-[#e06c60]" : "text-muted-foreground"}`}>
                          {u.aiUsedToday}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Select value={String(u.dailyAiLimit)} onValueChange={(v) => updateLimit(u.id, Number(v))}>
                        <SelectTrigger className="h-8 w-24 rounded-none font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {[10, 20, 40, 60, 100, 200].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}/day</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
