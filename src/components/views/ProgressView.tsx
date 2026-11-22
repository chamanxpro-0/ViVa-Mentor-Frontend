// Progress — score trend line, topic radar, activity heatmap, attempts
// history, streaks & badges (spec (§7 "Progress", feature C8)

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BADGE_META } from "@/lib/badge-meta";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis,
} from "recharts";

interface ProgressData {
  streak: number;
  xp: number;
  trend: { date: string; score: number; subject: string; sessionId: string }[];
  readiness: {
    subjectId: string;
    subject: string;
    index: number;
    band: string;
    perTopic: { topic: string; effectiveStrength: number; strength: number; attempts: number; weight: number }[];
  }[];
  badges: { type: string; earnedAt: string }[];
  recentAnswers: { id: string; topic: string; questionText: string; score: number; isFollowUp: boolean; inputType: string; createdAt: string }[];
  heatmap: { date: string; count: number }[];
  sessionCount: number;
  avgScore: number | null;
}

export default function ProgressView() {
  const sessionEnded = useApp((s) => s.sessionEnded);
  const openReport = useApp((s) => s.openReport);
  const [data, setData] = useState<ProgressData | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    void api<ProgressData>("/api/progress/me").then(setData).catch(() => setData(null));
  }, [sessionEnded]);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      </div>
    );
  }

  const trendFiltered = subjectFilter === "all" ? data.trend : data.trend.filter((t) => t.subject === subjectFilter);
  const readiness = subjectFilter === "all" ? data.readiness[0] : data.readiness.find((r) => r.subject === subjectFilter) ?? data.readiness[0];
  const radarData = (readiness?.perTopic ?? []).map((t) => ({
    topic: t.topic,
    strength: Math.round(t.effectiveStrength * 10) / 10,
  }));

  // heatmap: 12 weeks × 7 days grid
  const cells = data.heatmap;
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const maxCount = Math.max(1, ...cells.map((c) => c.count));
  function heatColor(count: number) {
    if (count === 0) return "bg-muted";
    const t = count / maxCount;
    if (t > 0.66) return "bg-emerald-600";
    if (t > 0.33) return "bg-emerald-500";
    return "bg-emerald-300";
  }

  const subjects = [...new Set(data.trend.map((t) => t.subject))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-sm text-muted-foreground">
            {data.sessionCount} sessions · avg {data.avgScore ?? "—"}/10 · {data.streak}-day streak · {data.xp} XP
          </p>
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score trend</CardTitle>
            <CardDescription>Overall score per completed session — click a point to open the report</CardDescription>
          </CardHeader>
          <CardContent>
            {trendFiltered.length < 2 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Finish at least two sessions to see the trend line.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendFiltered} onClick={(e) => {
                    const sid = e?.activePayload?.[0]?.payload?.sessionId;
                    if (sid) openReport(sid);
                  }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value) => [`${value}/10`, "score"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 4, cursor: "pointer" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Topic radar {readiness ? `· ${readiness.subject}` : ""}</CardTitle>
            <CardDescription>Effective strength = EMA of scores × coverage (attempts / 3)</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length < 3 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Practice more topics in this subject to fill the radar.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="strength" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity heatmap</CardTitle>
          <CardDescription>Answers given per day over the last 12 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto vm-scroll pb-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} answer${day.count === 1 ? "" : "s"}`}
                    className={`h-3.5 w-3.5 rounded-sm ${heatColor(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
            less
            <span className="h-3 w-3 rounded-sm bg-muted" />
            <span className="h-3 w-3 rounded-sm bg-emerald-300" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="h-3 w-3 rounded-sm bg-emerald-600" />
            more
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* attempts history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent answers</CardTitle>
            <CardDescription>Your latest graded answers across all subjects</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto vm-scroll">
            {data.recentAnswers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No answers yet.</p>
            ) : (
              <div className="divide-y">
                {data.recentAnswers.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2.5">
                    <div className={`h-8 w-8 shrink-0 rounded-lg grid place-items-center text-xs font-bold ${
                      a.score >= 7 ? "bg-emerald-600/10 text-emerald-700" : a.score >= 5 ? "bg-amber-500/10 text-amber-700" : "bg-rose-600/10 text-rose-700"
                    }`}>
                      {a.score.toFixed(1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{a.questionText}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.topic} · {a.isFollowUp ? "follow-up · " : ""}{a.inputType} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* badges */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Badges</CardTitle>
            <CardDescription>Consistency beats intensity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(BADGE_META).map(([type, meta]) => {
              const earned = data.badges.find((b) => b.type === type);
              return (
                <div
                  key={type}
                  className={`rounded-xl border p-3 text-center ${earned ? "border-primary/40 bg-primary/5" : "opacity-40"}`}
                  title={meta.description}
                >
                  <p className="font-display text-2xl leading-none text-primary">{meta.emoji}</p>
                  <p className="text-xs font-semibold mt-1">{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground">{earned ? new Date(earned.earnedAt).toLocaleDateString() : "locked"}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
