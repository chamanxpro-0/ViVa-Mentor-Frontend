// Teacher Panel — the faculty office. Dark oxford ink, brass and oxblood,
// serif authority, ledger tables. Question bank (C9), class analytics (C10),
// calibration (E7). Same data & logic as before — new register.

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicWeight } from "@/lib/types";

interface Subject { id: string; name: string; department: string; topics: TopicWeight[] }

interface BankQuestion {
  id: string; subject: string; subjectId: string; topic: string; difficulty: number;
  question: string; keyPoints: string[]; source: string; verified: boolean;
}

interface ClassData {
  subject: { id: string; name: string; department: string; topics: TopicWeight[] };
  sessionCount: number; completedSessions: number; totalAnswers: number; atRiskCount: number;
  topicAverages: { topic: string; weight: number; attempts: number; avgScore: number | null }[];
  mostMissed: { point: string; count: number }[];
  students: {
    id: string; name: string; email: string; readiness: number; band: string;
    attempts: number; avgScore: number | null; atRisk: boolean;
  }[];
}

interface CalibrationData {
  subject: { id: string; name: string };
  markedCount: number;
  correlation: number | null;
  meanDiff: number | null;
  bias: string | null;
  targetCorrelation: number;
  topicBias: { topic: string; meanDiff: number; count: number }[];
  sample: {
    id: string; student: string; topic: string; question: string; answerExcerpt: string;
    aiScore: number;
    teacherMark: { score: number; comment: string | null; teacher: string } | null;
  }[];
}

const CHART_TICK = { fontSize: 10, fill: "#97a0af" };

export default function TeacherPanel() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [subjectId, setSubjectId] = useState<string>("");

  useEffect(() => {
    void api<{ subjects: Subject[] }>("/api/subjects").then((d) => {
      setSubjects(d.subjects);
      const dbms = d.subjects.find((s) => s.name === "DBMS") ?? d.subjects[0];
      if (dbms) setSubjectId(dbms.id);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* masthead */}
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            Faculty authority · department panel
          </p>
          <h1 className="mt-3 font-display text-4xl leading-none tracking-tight md:text-5xl">
            The examination register
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Question banks, class readiness and AI calibration — see which topics the whole
            class finds difficult before the real viva takes place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">subject</span>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="h-10 w-56 rounded-none border-primary/40 bg-transparent font-display text-base">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {(subjects ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="h-auto gap-0 rounded-none border-b border-border bg-transparent p-0">
          {([
            ["analytics", "I", "Class analytics"],
            ["bank", "II", "Question bank"],
            ["calibration", "III", "Calibration"],
          ] as const).map(([v, n, label]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="relative gap-2.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3.5 text-[13px] font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-5"
            >
              <span className="font-display text-sm italic text-primary/80">{n}</span>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="analytics" className="mt-8">
          <ClassAnalytics key={subjectId} subjectId={subjectId} />
        </TabsContent>
        <TabsContent value="bank" className="mt-8">
          <QuestionBank key={`bank-${subjectId}`} subjects={subjects} subjectId={subjectId} />
        </TabsContent>
        <TabsContent value="calibration" className="mt-8">
          <Calibration key={`cal-${subjectId}`} subjectId={subjectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LedgerFigure({
  value,
  label,
  note,
  accent,
}: { value: React.ReactNode; label: string; note?: string; accent?: boolean }) {
  return (
    <div className="border-l border-border pl-5">
      <p className={cn("font-display text-5xl leading-none", accent ? "text-[#c97b72]" : "text-primary")}>
        {value}
      </p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      {note && <p className="mt-1.5 text-[11px] text-muted-foreground/80">{note}</p>}
    </div>
  );
}

function ClassAnalytics({ subjectId }: { subjectId: string }) {
  const [data, setData] = useState<ClassData | null>(null);

  useEffect(() => {
    if (!subjectId) return;
    let alive = true;
    api<ClassData>(`/api/analytics/class/${subjectId}`)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); });
    return () => { alive = false; };
  }, [subjectId]);

  if (!subjectId) return null;
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 bg-muted/40" />)}
        </div>
        <Skeleton className="h-80 bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ledger figures */}
      <div className="vm-ledger grid grid-cols-2 gap-x-6 gap-y-8 rounded-sm border border-border bg-card py-8 lg:grid-cols-4">
        <div className="px-6"><LedgerFigure value={data.students.length} label="students practicing" /></div>
        <div className="px-6"><LedgerFigure value={data.sessionCount} label="sessions started" note={`${data.completedSessions} completed`} /></div>
        <div className="px-6"><LedgerFigure value={data.totalAnswers} label="answers graded" /></div>
        <div className="px-6"><LedgerFigure value={data.atRiskCount} label="students at risk" accent={data.atRiskCount > 0} note={data.atRiskCount > 0 ? "summon for a mock" : "all on track"} /></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* topic averages */}
        <section className="rounded-sm border border-border bg-card p-6">
          <div className="border-b border-border pb-4">
            <h2 className="font-display text-2xl">Average score per topic</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Where the whole class struggles — before the real viva
            </p>
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topicAverages}>
                <CartesianGrid stroke="rgba(237,230,214,0.07)" vertical={false} />
                <XAxis dataKey="topic" tick={CHART_TICK} interval={0} angle={-20} textAnchor="end" height={64} stroke="rgba(237,230,214,0.25)" />
                <YAxis domain={[0, 10]} tick={CHART_TICK} stroke="rgba(237,230,214,0.25)" label={{ value: "avg / 10", angle: -90, position: "insideLeft", fill: "#97a0af", fontSize: 10, dy: 60 }} />
                <Tooltip
                  cursor={{ fill: "rgba(176,141,62,0.06)" }}
                  contentStyle={{ background: "#1a222d", border: "1px solid rgba(237,230,214,0.16)", borderRadius: 0, color: "#ede6d6", fontSize: 12 }}
                />
                <Bar dataKey="avgScore" name="avg score" fill="#b08d3e" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* most missed */}
        <section className="rounded-sm border border-border bg-card p-6">
          <div className="border-b border-border pb-4">
            <h2 className="font-display text-2xl">Most-missed key points</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">Aggregated across every graded answer</p>
          </div>
          <div className="vm-scroll mt-2 max-h-72 overflow-y-auto">
            {data.mostMissed.length === 0 ? (
              <p className="py-10 text-center font-display text-lg italic text-muted-foreground">
                Nothing missed yet.
              </p>
            ) : (
              <ol className="divide-y divide-border/60">
                {data.mostMissed.map((m, i) => (
                  <li key={m.point} className="flex items-baseline gap-4 py-3">
                    <span className="w-7 shrink-0 font-display text-sm italic text-primary/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-sm leading-snug">{m.point}</span>
                    <span className="shrink-0 rounded-full border border-[#7a2e3d]/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#c97b72]">
                      {m.count}× missed
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      {/* students registry */}
      <section className="rounded-sm border border-border bg-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-6 py-4">
          <h2 className="font-display text-2xl">
            The register <span className="ml-2 font-display text-base italic text-muted-foreground">{data.subject.name}</span>
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            sorted by readiness — weakest first
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-6 py-3 font-normal">Student</th>
                <th className="px-4 py-3 font-normal">Readiness</th>
                <th className="px-4 py-3 font-normal">Answers</th>
                <th className="px-4 py-3 font-normal">Avg score</th>
                <th className="px-6 py-3 font-normal">Standing</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="h-[3px] w-24 bg-muted">
                        <span
                          className="block h-full"
                          style={{
                            width: `${s.readiness}%`,
                            background: s.band === "green" ? "#6e8b5e" : s.band === "amber" ? "#b08d3e" : "#7a2e3d",
                          }}
                        />
                      </span>
                      <span className="font-display text-lg tabular-nums">{s.readiness}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-muted-foreground">{s.attempts}</td>
                  <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {s.avgScore ?? "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    {s.atRisk ? (
                      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c97b72]">
                        <span className="grid h-4 w-4 place-items-center rounded-full border border-[#7a2e3d]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#7a2e3d]" />
                        </span>
                        at risk
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        on track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function QuestionBank({ subjects, subjectId }: { subjects: Subject[] | null; subjectId: string }) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<BankQuestion[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const subject = subjects?.find((s) => s.id === subjectId);
  const [form, setForm] = useState(() => ({
    topic: subject?.topics[0]?.name ?? "",
    difficulty: 3,
    question: "",
    keyPoints: "",
  }));

  useEffect(() => {
    let alive = true;
    api<{ questions: BankQuestion[] }>(`/api/questions?subjectId=${subjectId}`)
      .then((d) => { if (alive) setQuestions(d.questions); })
      .catch(() => { if (alive) setQuestions([]); });
    return () => { alive = false; };
  }, [subjectId]);

  async function addQuestion() {
    if (!subjectId) return;
    const keyPoints = form.keyPoints.split("\n").map((s) => s.trim()).filter(Boolean);
    if (form.question.trim().length < 10 || keyPoints.length < 2 || !form.topic) {
      toast({ title: "Fill the full question", description: "A question (10+ chars), a topic and at least 2 key points are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api("/api/questions", {
        method: "POST",
        body: JSON.stringify({
          subjectId, topic: form.topic, difficulty: form.difficulty,
          question: form.question.trim(), keyPoints,
        }),
      });
      setOpen(false);
      setForm({ topic: subject?.topics[0]?.name ?? "", difficulty: 3, question: "", keyPoints: "" });
      setQuestions((prev) =>
        prev
          ? [{
              id: `local-${Date.now()}`,
              subject: subject?.name ?? "",
              subjectId,
              topic: form.topic,
              difficulty: form.difficulty,
              question: form.question.trim(),
              keyPoints,
              source: "teacher",
              verified: true,
            }, ...prev]
          : prev
      );
      toast({ title: "Question entered into the register", description: "The question is saved to this browser’s local demo bank." });
    } catch (err) {
      toast({ title: "Could not save", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-sm border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <h2 className="font-display text-2xl">Teacher-verified question bank</h2>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            The engine prefers these and must check their key points — and it cuts AI cost
            (spec (§11).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 gap-2 rounded-none px-5 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <Plus className="h-4 w-4" /> Enter a question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-none border-border bg-popover">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Enter a verified question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Topic</Label>
                  <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                    <SelectTrigger className="rounded-none"><SelectValue placeholder="Topic" /></SelectTrigger>
                    <SelectContent className="rounded-none">
                      {(subject?.topics ?? []).map((t) => (
                        <SelectItem key={t.name} value={t.name}>{t.name} ({Math.round(t.weight * 100)}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Difficulty — {form.difficulty}/5
                  </Label>
                  <Slider value={[form.difficulty]} min={1} max={5} step={1} onValueChange={([v]) => setForm({ ...form, difficulty: v })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Question</Label>
                <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="rounded-none"
                  placeholder="e.g. Explain how B+ tree indexes handle range queries." />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Expected key points — one per line, min 2
                </Label>
                <Textarea value={form.keyPoints} onChange={(e) => setForm({ ...form, keyPoints: e.target.value })}
                  className="rounded-none"
                  placeholder={"leaves linked for range scans\ninternal nodes only store keys\nlog n height"} />
              </div>
              <Button onClick={addQuestion} disabled={saving} className="w-full gap-2 rounded-none text-[11px] font-semibold uppercase tracking-[0.14em]">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Enter into the register
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6">
        {questions === null ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 bg-muted/40" />)}</div>
        ) : questions.length === 0 ? (
          <p className="py-12 text-center font-display text-lg italic text-muted-foreground">
            No verified questions for this subject yet.
          </p>
        ) : (
          <div className="vm-scroll max-h-[32rem] divide-y divide-border/60 overflow-y-auto">
            {questions.map((q) => (
              <article key={q.id} className="grid gap-2 py-5 sm:grid-cols-[8.5rem_1fr] sm:gap-x-7">
                <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted-foreground">
                  <p className="text-primary/90">{q.topic}</p>
                  <p className="mt-1">diff {q.difficulty}/5</p>
                  <p className="mt-1">{q.source}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium leading-snug">{q.question}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    key points — {q.keyPoints.join(" · ")}
                  </p>
                  {q.verified && (
                    <Badge className="mt-2 rounded-none border border-[#6e8b5e]/50 bg-transparent px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8fae7c] hover:bg-transparent">
                      verified
                    </Badge>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Calibration({ subjectId }: { subjectId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState<CalibrationData | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [markScore, setMarkScore] = useState("7");
  const [markComment, setMarkComment] = useState("");

  useEffect(() => {
    if (!subjectId) return;
    let alive = true;
    api<CalibrationData>(`/api/calibration/${subjectId}`)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); });
    return () => { alive = false; };
  }, [subjectId]);

  async function saveMark(answerId: string) {
    setMarking(answerId);
    try {
      await api("/api/calibration/mark", {
        method: "POST",
        body: JSON.stringify({ answerId, score: Number(markScore), comment: markComment || undefined }),
      });
      setMarkComment("");
      await load();
      toast({ title: "Mark recorded", description: "The correlation and bias figures updated." });
    } catch (err) {
      toast({ title: "Could not save mark", description: (err as Error).message, variant: "destructive" });
    } finally {
      setMarking(null);
    }
  }

  async function load() {
    try {
      const d = await api<CalibrationData>(`/api/calibration/${subjectId}`);
      setData(d);
    } catch { /* keep current */ }
  }

  if (!subjectId) return null;
  if (!data) return <Skeleton className="h-96 bg-muted/40" />;

  const corrOk = data.correlation != null && data.correlation >= data.targetCorrelation;

  return (
    <div className="space-y-8">
      {/* correlation instrument */}
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="rounded-sm border border-primary/25 bg-primary/[0.04] p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Pearson correlation — AI vs teacher
          </p>
          <p className="mt-5 font-display text-7xl leading-none text-primary">
            {data.correlation != null ? data.correlation.toFixed(2) : "—"}
          </p>
          {data.correlation != null && (
            <p className={cn("mt-4 font-mono text-[10px] uppercase tracking-[0.2em]", corrOk ? "text-[#8fae7c]" : "text-[#c9a45c]")}>
              {corrOk ? "meets target" : "below target"} · target ≥ {data.targetCorrelation} (§9)
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            &quot;Can we trust the AI marks?&quot; — this is the evidence.
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Mean difference — AI − teacher
          </p>
          <p className="mt-5 font-display text-6xl leading-none">
            {data.meanDiff != null ? (data.meanDiff > 0 ? "+" : "") + data.meanDiff.toFixed(2) : "—"}
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {data.bias ?? "no marks yet"}
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Answers marked
          </p>
          <p className="mt-5 font-display text-6xl leading-none">{data.markedCount}</p>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Mark more below — the figures update live.
          </p>
        </div>
      </div>

      {data.topicBias.length > 0 && (
        <section className="rounded-sm border border-border bg-card p-6">
          <h2 className="border-b border-border pb-4 font-display text-2xl">Bias by topic</h2>
          <p className="mt-3 text-xs text-muted-foreground">
            Where the AI is too strict (negative) or too lenient (positive)
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {data.topicBias.map((t) => (
              <span
                key={t.topic}
                className={cn(
                  "rounded-none border px-3 py-1.5 font-mono text-xs",
                  t.meanDiff <= -0.5
                    ? "border-[#7a2e3d]/70 text-[#e39a90]"
                    : t.meanDiff >= 0.5
                      ? "border-primary/60 text-[#d9b866]"
                      : "border-border text-foreground/70"
                )}
              >
                {t.topic}: {t.meanDiff > 0 ? "+" : ""}{t.meanDiff.toFixed(2)} ({t.count}×)
              </span>
            ))}
          </div>
        </section>
      )}

      {/* marking desk */}
      <section className="rounded-sm border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-display text-2xl">The marking desk</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Grade a few real answers yourself — the register updates as you go.
          </p>
        </div>
        <div className="vm-scroll max-h-[36rem] space-y-4 overflow-y-auto p-6">
          {data.sample.length === 0 ? (
            <p className="py-12 text-center font-display text-lg italic text-muted-foreground">
              No answers recorded for this subject yet.
            </p>
          ) : (
            data.sample.map((a) => (
              <article key={a.id} className="vm-ledger rounded-sm border border-border/70 p-5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                  <span className="text-sm font-medium">{a.student}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{a.topic}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    AI score <span className="font-display text-lg text-primary">{a.aiScore.toFixed(1)}</span>
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium leading-snug">{a.question}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.answerExcerpt}…</p>

                {a.teacherMark && (
                  <p className="mt-3 border-l-2 border-[#6e8b5e]/60 pl-3 text-xs italic text-muted-foreground">
                    your mark — {a.teacherMark.score.toFixed(1)}
                    {a.teacherMark.comment ? ` · “${a.teacherMark.comment}”` : ""}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="w-24 space-y-1.5">
                    <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Your score 0–10</Label>
                    <Input type="number" min={0} max={10} step={0.5} value={marking === a.id ? markScore : (a.teacherMark?.score ?? markScore)}
                      onChange={(e) => setMarkScore(e.target.value)} className="h-9 rounded-none font-mono text-sm" />
                  </div>
                  <div className="min-w-48 flex-1 space-y-1.5">
                    <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Comment — optional</Label>
                    <Input value={marking === a.id ? markComment : (a.teacherMark?.comment ?? "")}
                      onChange={(e) => setMarkComment(e.target.value)} placeholder="What did the AI miss or over-credit?"
                      className="h-9 rounded-none text-sm" />
                  </div>
                  <Button size="sm" onClick={() => saveMark(a.id)} disabled={marking === a.id}
                    className="h-9 gap-1.5 rounded-none font-mono text-[10px] uppercase tracking-[0.14em]">
                    {marking === a.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {a.teacherMark ? "Update" : "Record mark"}
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
