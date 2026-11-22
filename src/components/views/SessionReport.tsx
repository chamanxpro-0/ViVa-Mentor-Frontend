// Session Report — overall score, question-wise breakdown, strengths,
// weaknesses, delivery summary, PDF download (spec (§7 "Session Report")

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PERSONA_LABELS, MODE_LABELS, type Mode, type PersonaId } from "@/lib/types";
import { Download, Repeat2, Trophy, Mic, TrendingUp, AlertTriangle } from "lucide-react";

interface SessionDetail {
  id: string;
  mode: string;
  persona: string;
  subject: string;
  status: string;
  totalScore: number | null;
  delivery: { avgWpm: number; fillerPerMin: number; pauses: number } | null;
  startedAt: string;
}

interface ReportData {
  sessionId: string;
  totalScore: number | null;
  criteriaAvg: { correctness: number; completeness: number; clarity: number; depth: number };
  delivery: { avgWpm: number; fillerPerMin: number; pauses: number } | null;
  cardsCreated: number;
  newStreak: number;
  newBadges: string[];
  answeredCount: number;
}

// answers are fetched through a tiny JSON projection of the report endpoint
interface AnswerRow {
  id: string;
  questionText: string;
  topic: string;
  isFollowUp: boolean;
  score: number;
  missingPoints: string[];
  coveredPoints: string[];
}

export default function SessionReport() {
  const sessionId = useApp((s) => s.reportSessionId);
  const setView = useApp((s) => s.setView);
  const { toast } = useToast();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [finish, setFinish] = useState<ReportData | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[] | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    void api<{ sessions: SessionDetail[] }>("/api/sessions").then((d) => {
      setSession(d.sessions.find((s) => s.id === sessionId) ?? null);
    });
    // finish endpoint is idempotent — it returns the stored summary
    void api<ReportData>(`/api/sessions/${sessionId}/finish`, { method: "POST" })
      .then(setFinish)
      .catch(() => setFinish(null));
  }, [sessionId]);

  // For the question-wise breakdown, re-derive from the PDF endpoint is not possible;
  // use the session finish + answers through /api/progress/me recent answers filtered by session.
  useEffect(() => {
    if (!sessionId) return;
    void api<{ recentAnswers: (AnswerRow & { sessionId: string })[] }>("/api/progress/me").then((d) => {
      setAnswers(d.recentAnswers.filter((a) => a.sessionId === sessionId).slice().reverse());
    }).catch(() => setAnswers([]));
  }, [sessionId]);

  async function downloadPdf() {
    if (!sessionId) return;
    setDownloading(true);
    try {
      // The frontend-only demo has no PDF service. The browser print dialog
      // can save this report as a PDF without a server dependency.
      window.print();
      toast({ title: "Print dialog opened", description: "Choose ‘Save as PDF’ in your browser to export this report." });
    } catch (err) {
      toast({ title: "Could not open print dialog", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  if (!sessionId) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="py-10 text-center text-muted-foreground">
          No report selected. Finish a session or open one from the dashboard.
        </CardContent>
      </Card>
    );
  }

  const criteria = finish?.criteriaAvg;
  const topics = [...new Set((answers ?? []).map((a) => a.topic))];
  const topicAvg = topics.map((t) => {
    const xs = (answers ?? []).filter((a) => a.topic === t);
    return { topic: t, avg: xs.reduce((s, x) => s + x.score, 0) / xs.length };
  });
  const strengths = topicAvg.filter((t) => t.avg >= 7).map((t) => t.topic);
  const weaknesses = topicAvg.filter((t) => t.avg < 6).map((t) => t.topic);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Session report</h1>
          <p className="text-sm text-muted-foreground">
            {session ? `${session.subject} · ${MODE_LABELS[session.mode as Mode] ?? session.mode} · ${PERSONA_LABELS[session.persona as PersonaId] ?? session.persona}` : "…"}
            {session && ` · ${new Date(session.startedAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView("dashboard")}>Back to dashboard</Button>
          <Button variant="outline" onClick={() => setView("revision")} className="gap-2">
            <Repeat2 className="h-4 w-4" /> Revision
          </Button>
          <Button onClick={downloadPdf} disabled={downloading} className="gap-2">
            <Download className="h-4 w-4" /> {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* overall + criteria */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-5xl font-bold text-primary">
              {finish?.totalScore != null ? finish.totalScore.toFixed(1) : session?.totalScore != null ? session.totalScore.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">overall score / 10</p>
            <p className="text-xs text-muted-foreground">{finish?.answeredCount ?? answers?.length ?? 0} answers graded</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Rubric averages</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {criteria ? (
              (Object.entries(criteria) as [string, number][]).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{k} <span className="text-muted-foreground text-xs">({({ correctness: "40%", completeness: "25%", clarity: "20%", depth: "15%" } as Record<string, string>)[k]})</span></span>
                    <span className="font-semibold">{v.toFixed(1)}/10</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-700" style={{ width: `${v * 10}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
            <p className="text-[11px] text-muted-foreground">
              Final score per answer = 0.4×correctness + 0.25×completeness + 0.2×clarity + 0.15×depth (weights editable by the teacher).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* delivery + outcomes */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Mic className="h-4 w-4 text-primary" /> Delivery</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {finish?.delivery || session?.delivery ? (
              <>
                <p><span className="font-semibold">{finish?.delivery?.avgWpm ?? session?.delivery?.avgWpm}</span> WPM average (target 110–160)</p>
                <p><span className="font-semibold">{finish?.delivery?.fillerPerMin ?? session?.delivery?.fillerPerMin}</span> fillers/min (target &lt; 5)</p>
                <p><span className="font-semibold">{finish?.delivery?.pauses ?? session?.delivery?.pauses}</span> long pauses</p>
              </>
            ) : (
              <p className="text-muted-foreground">Typed session — no voice metrics.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <p><span className="font-semibold text-primary">{finish?.cardsCreated ?? 0}</span> flashcards added to your revision plan</p>
            {finish?.newStreak != null && <p>Streak: <span className="font-semibold">{finish.newStreak} days — kept alive</span></p>}
            {finish?.newBadges && finish.newBadges.length > 0 && (
              <p className="text-xs">New badge{finish.newBadges.length > 1 ? "s" : ""}: {finish.newBadges.join(", ")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Strengths &amp; gaps</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1.5">
            {strengths.length > 0 && (
              <p className="flex items-start gap-1.5"><TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> <span><span className="font-medium">Strong:</span> {strengths.join(", ")}</span></p>
            )}
            {weaknesses.length > 0 && (
              <p className="flex items-start gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> <span><span className="font-medium">To improve:</span> {weaknesses.join(", ")}</span></p>
            )}
            {strengths.length === 0 && weaknesses.length === 0 && <p className="text-muted-foreground">Complete the session to see topic breakdown.</p>}
          </CardContent>
        </Card>
      </div>

      {/* question-wise */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Question-wise breakdown</CardTitle>
          <CardDescription>Every graded answer, including follow-ups</CardDescription>
        </CardHeader>
        <CardContent>
          {!answers ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : answers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No answers were recorded in this session.</p>
          ) : (
            <div className="space-y-2">
              {answers.map((a, i) => (
                <div key={a.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">
                        {i + 1}. {a.isFollowUp && <Badge variant="destructive" className="h-4 px-1.5 mr-1 text-[10px]">follow-up</Badge>}
                        {a.topic}
                      </p>
                      <p className="text-sm font-medium">{a.questionText}</p>
                    </div>
                    <div className={cn2("shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold",
                      a.score >= 7 ? "bg-emerald-600/10 text-emerald-700" : a.score >= 5 ? "bg-amber-500/10 text-amber-700" : "bg-rose-600/10 text-rose-700")}>
                      {a.score.toFixed(1)}
                    </div>
                  </div>
                  {a.missingPoints && a.missingPoints.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">✗ missed: {a.missingPoints.join("; ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn2(...parts: string[]) {
  return parts.filter(Boolean).join(" ");
}
