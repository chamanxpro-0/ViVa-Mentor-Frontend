// Session Setup — mode, subject, topics, difficulty, question count, time
// limit, persona, optional document (spec (§7 "Session Setup")

"use client";

import { useEffect, useRef, useState } from "react";
import { api, uploadDocument } from "@/lib/client";
import { useApp } from "@/store/app";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { PERSONAS } from "@/lib/personas";
import { MODE_LABELS, type Mode, type PersonaId, type TopicWeight } from "@/lib/types";
import { Mic, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  department: string;
  topics: TopicWeight[];
}

interface Doc {
  id: string;
  type: string;
  fileName: string;
  chunkCount: number;
  pageCount: number;
}

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "viva", label: "Subject Viva", desc: "University-style oral exam on a subject" },
  { id: "hr", label: "HR Interview", desc: "Placement-style HR rounds" },
  { id: "technical", label: "Technical Interview", desc: "Applied, scenario-based technical rounds" },
];

export default function SessionSetup() {
  const { startInterview, refreshMe } = useApp();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [mode, setMode] = useState<Mode>("viva");
  const [subjectId, setSubjectId] = useState<string>("");
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(5);
  const [persona, setPersona] = useState<PersonaId>("friendly");
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [documentId, setDocumentId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api<{ subjects: Subject[] }>("/api/subjects").then((d) => {
      setSubjects(d.subjects);
      const dbms = d.subjects.find((s) => s.name === "DBMS") ?? d.subjects[0];
      if (dbms) {
        setSubjectId(dbms.id);
        setTopics(dbms.topics.map((t) => t.name));
      }
    });
    void loadDocs();
  }, []);

  async function loadDocs() {
    try {
      const d = await api<{ documents: Doc[] }>("/api/documents");
      setDocs(d.documents);
    } catch {
      /* ignore */
    }
  }

  const subject = subjects?.find((s) => s.id === subjectId);

  function toggleTopic(name: string) {
    setTopics((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  function pickPersona(id: PersonaId) {
    setPersona(id);
    setTimeLimit(PERSONAS[id].timeLimitSec);
  }

  async function onUpload(file: File | undefined, type: "resume" | "syllabus") {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDocument(file, type);
      setDocumentId(res.document.id);
      await loadDocs();
      toast({
        title: "Demo document saved",
        description: `${res.document.fileName} metadata saved locally in this browser demo. File contents are not processed.`,
      });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteDoc(id: string) {
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      if (documentId === id) setDocumentId("");
      await loadDocs();
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  async function start() {
    if (topics.length === 0) {
      toast({ title: "Pick at least one topic", variant: "destructive" });
      return;
    }
    setStarting(true);
    try {
      const res = await api<{ session: { id: string } }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          mode,
          persona,
          subjectId,
          topics,
          difficulty,
          questionCount,
          timeLimit,
          documentId: documentId || undefined,
        }),
      });
      await refreshMe();
      startInterview(res.session.id);
    } catch (err) {
      toast({ title: "Could not start session", description: (err as Error).message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set up your session</h1>
        <p className="text-muted-foreground text-sm">
          The examiner adapts to your choices — weak topics appear more often, and gaps trigger follow-ups.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* mode */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">1 · Mode</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  if (m.id === "hr") {
                    const hr = subjects?.find((s) => s.name === "HR Interview");
                    if (hr) {
                      setSubjectId(hr.id);
                      setTopics(hr.topics.map((t) => t.name));
                    }
                  }
                }}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  mode === m.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                )}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* subject + topics */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2 · Subject &amp; topics</CardTitle>
            <CardDescription>Topic weights decide their share of your readiness index</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {(subjects ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSubjectId(s.id);
                    setTopics(s.topics.map((t) => t.name));
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    subjectId === s.id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40"
                  )}
                >
                  {s.name}
                </button>
              ))}
              {subjects === null && <p className="text-sm text-muted-foreground">Loading subjects…</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {(subject?.topics ?? []).map((t) => (
                <button
                  key={t.name}
                  onClick={() => toggleTopic(t.name)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                    topics.includes(t.name) ? "border-primary bg-primary/5" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", topics.includes(t.name) ? "bg-primary" : "bg-muted-foreground/30")} />
                    {t.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{Math.round(t.weight * 100)}%</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* persona */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3 · Examiner persona</CardTitle>
            <CardDescription>Tone, follow-ups and strictness change</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.values(PERSONAS).map((p) => (
              <button
                key={p.id}
                onClick={() => pickPersona(p.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  persona === p.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                )}
              >
                <p className="text-sm font-semibold">
                  <span className="mr-1.5 font-display text-base text-primary">{p.emoji}</span>
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">{p.tagline}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {p.followUpMax} follow-up max · {p.timeLimitSec}s per question
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* difficulty / count / time */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">4 · Difficulty &amp; length</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <Label>Starting difficulty</Label>
                <span className="font-medium text-primary">{["", "Beginner", "Easy", "Moderate", "Hard", "Expert"][difficulty]}</span>
              </div>
              <Slider value={[difficulty]} min={1} max={5} step={1} onValueChange={([v]) => setDifficulty(v)} />
              <p className="text-[11px] text-muted-foreground mt-1">Adapts live: two strong answers push it up, two weak ones pull it down.</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <Label>Questions</Label>
                <span className="font-medium text-primary">{questionCount}</span>
              </div>
              <Slider value={[questionCount]} min={3} max={12} step={1} onValueChange={([v]) => setQuestionCount(v)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <Label>Time per question</Label>
                <span className="font-medium text-primary">{Math.floor(timeLimit / 60)}:{String(timeLimit % 60).padStart(2, "0")}</span>
              </div>
              <Slider value={[timeLimit]} min={30} max={300} step={15} onValueChange={([v]) => setTimeLimit(v)} />
            </div>
          </CardContent>
        </Card>

        {/* document-aware (E4) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">5 · Document-aware mode <Badge className="ml-1" variant="secondary">optional</Badge></CardTitle>
            <CardDescription>Upload a resume or syllabus — questions get personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className={cn("cursor-pointer rounded-xl border-2 border-dashed p-3 text-center transition-colors hover:border-primary/60", uploading && "opacity-50")}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onUpload(e.target.files?.[0], "resume")}
                />
                <Upload className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Upload resume</p>
                <p className="text-[10px] text-muted-foreground">PDF, max 8 MB</p>
              </label>
              <label className={cn("cursor-pointer rounded-xl border-2 border-dashed p-3 text-center transition-colors hover:border-primary/60", uploading && "opacity-50")}>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onUpload(e.target.files?.[0], "syllabus")}
                />
                <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Upload syllabus</p>
                <p className="text-[10px] text-muted-foreground">PDF, max 8 MB</p>
              </label>
            </div>
            {uploading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving document metadata locally…
              </p>
            )}
            {docs.length > 0 && (
              <div className="space-y-1.5">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{d.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{d.type} · demo metadata · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    {documentId === d.id ? (
                      <Badge variant="default" className="text-[10px]">in use</Badge>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setDocumentId(d.id)}>
                        use
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Delete document" onClick={() => deleteDoc(d.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">
                  Private to you — delete anytime. Nothing is shared with other students.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="text-sm text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">{subject?.name ?? "—"}</span> ·{" "}
            {MODE_LABELS[mode]} · {PERSONAS[persona].emoji} {PERSONAS[persona].name} · {questionCount} questions ·{" "}
            {topics.length} topic{topics.length === 1 ? "" : "s"} selected
            {documentId && " · document attached"}
          </p>
        </div>
        <Button size="lg" onClick={start} disabled={starting || !subjectId} className="gap-2">
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {starting ? "Creating session…" : "Enter the interview room"}
        </Button>
      </div>
    </div>
  );
}
