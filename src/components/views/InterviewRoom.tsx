// Interview Room — examiner card, question, mic + live transcript, per-question
// timer, live pace indicator, integrity capture, inline feedback screen
// (spec (§7 "Interview Room" + "Feedback Screen", features C5, C6, E1, E2, E8)

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PERSONAS } from "@/lib/personas";
import { DELIVERY_TARGETS, type Evaluation, type QuestionPayload } from "@/lib/types";
import {
  Mic, MicOff, Send, ArrowRight, Timer, Loader2, ShieldAlert, Gauge,
  MessageSquareText, Flag, CheckCircle2, XCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionInfo {
  id: string;
  mode: string;
  persona: string;
  timeLimit: number;
  questionCount: number;
  subject: string;
}

interface AnswerResponse {
  answerId: string;
  evaluation: Evaluation;
  degraded: boolean;
  adaptive: { difficulty: number; changed: "up" | "down" | null; prerequisite: boolean };
  nextAction: "followup" | "question" | "done";
  progress: { asked: number; total: number };
}

type Phase = "loading-session" | "loading-question" | "question" | "grading" | "feedback" | "finishing" | "done";

function paceColor(wpm: number) {
  if (wpm === 0) return "text-muted-foreground";
  if (wpm < DELIVERY_TARGETS.wpmMin) return "text-amber-600";
  if (wpm <= DELIVERY_TARGETS.wpmMax) return "text-emerald-600";
  return "text-rose-600";
}

export default function InterviewRoom() {
  const sessionId = useApp((s) => s.activeSessionId);
  const openReport = useApp((s) => s.openReport);
  const bumpSessionEnd = useApp((s) => s.bumpSessionEnd);
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("loading-session");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [followUpReason, setFollowUpReason] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResponse | null>(null);
  const [lastDelivery, setLastDelivery] = useState<{
    wpm: number;
    fillers: number;
    fillerPerMin: number;
    pauses: number;
    wordCount: number;
    durationSec: number;
  } | null>(null);
  const [lastIntegrity, setLastIntegrity] = useState<{
    pasted: boolean;
    pasteCount: number;
    cps: number;
    firstKeystrokeSec: number;
  } | null>(null);
  const [asked, setAsked] = useState(0);

  // typed answer + integrity signals (E8)
  const [typed, setTyped] = useState("");
  const integrity = useRef({ pasted: false, pasteCount: 0, firstKeystrokeAt: 0 as number | null, charsTyped: 0 });
  const questionShownAt = useRef<number>(Date.now());

  // per-question countdown
  const [remaining, setRemaining] = useState(0);
  const submittingRef = useRef(false);

  const speech = useSpeechRecognition();

  const fetchQuestion = useCallback(async () => {
    if (!sessionId) return;
    setPhase("loading-question");
    setTyped("");
    integrity.current = { pasted: false, pasteCount: 0, firstKeystrokeAt: null, charsTyped: 0 };
    speech.reset();
    try {
      const res = await api<{ done: boolean; question?: QuestionPayload; reason?: string; harder?: boolean }>(
        `/api/sessions/${sessionId}/question`
      );
      if (res.done) {
        setPhase("done");
      } else if (res.question) {
        setQuestion(res.question);
        setFollowUpReason(res.reason ?? null);
        questionShownAt.current = Date.now();
        setRemaining((session?.timeLimit ?? 120));
        setPhase("question");
      }
    } catch (err) {
      toast({ title: "Could not get the next question", description: (err as Error).message, variant: "destructive" });
      setPhase("question");
    }
  }, [sessionId, session?.timeLimit, toast]);

  // boot: load session info, then first question
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await api<{ sessions: (SessionInfo & { startedAt: string })[] }>("/api/sessions");
        const s = list.sessions.find((x) => x.id === sessionId);
        if (cancelled) return;
        setSession(s ? { ...s, subject: s.subject } : null);
      } catch {
        /* handled by fetchQuestion errors */
      }
      await fetchQuestion();
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // countdown
  useEffect(() => {
    if (phase !== "question") return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          if (!submittingRef.current) void submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, question?.questionText]);

  const submit = useCallback(
    async (timedOut = false) => {
      if (!sessionId || !question || submittingRef.current) return;
      submittingRef.current = true;
      speech.stop();
      setPhase("grading");

      const answerText = (speech.transcript || typed).trim();
      const inputType: "voice" | "text" = speech.transcript.trim().length > 0 ? "voice" : "text";
      const timeTaken = Math.round((Date.now() - questionShownAt.current) / 1000);

      if (!answerText && !timedOut) {
        toast({ title: "Answer is empty", description: "Speak or type your answer first.", variant: "destructive" });
        setPhase("question");
        submittingRef.current = false;
        return;
      }

      const delivery = inputType === "voice" ? speech.computeDelivery() : undefined;
      const first = integrity.current.firstKeystrokeAt;
      const typingSeconds = first ? (Date.now() - first) / 1000 : 0;
      const integrityPayload =
        inputType === "text"
          ? {
              pasted: integrity.current.pasted,
              pasteCount: integrity.current.pasteCount,
              cps: typingSeconds > 0 ? Math.round((integrity.current.charsTyped / typingSeconds) * 10) / 10 : 0,
              firstKeystrokeSec: first ? Math.round((first - questionShownAt.current) / 1000) : 0,
            }
          : undefined;

      setLastDelivery(delivery ?? null);
      setLastIntegrity(integrityPayload ?? null);

      try {
        const res = await api<AnswerResponse>(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          body: JSON.stringify({
            userAnswer: answerText || "(no answer — timed out)",
            inputType,
            timeTaken,
            delivery,
            integrity: integrityPayload,
          }),
        });
        setLastResult(res);
        setAsked(res.progress.asked);
        setPhase("feedback");
      } catch (err) {
        toast({ title: "Evaluation failed", description: (err as Error).message, variant: "destructive" });
        setPhase("question");
      } finally {
        submittingRef.current = false;
      }
    },
    [sessionId, question, speech, typed, toast]
  );

  async function finish() {
    if (!sessionId) return;
    setPhase("finishing");
    try {
      await api(`/api/sessions/${sessionId}/finish`, { method: "POST" });
      bumpSessionEnd();
      openReport(sessionId);
    } catch (err) {
      toast({ title: "Could not finish session", description: (err as Error).message, variant: "destructive" });
      setPhase("feedback");
    }
  }

  if (!sessionId) return null;
  const persona = PERSONAS[(session?.persona ?? "friendly") as "friendly" | "strict" | "rapid"];
  const eval_ = lastResult?.evaluation;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => useApp.getState().setView("dashboard")}>
          ← Exit
        </Button>
        <h1 className="text-lg font-bold">Interview Room</h1>
        <Badge variant="outline">{session?.subject ?? "…"}</Badge>
        <Badge variant="outline"><span className="mr-1 font-display">{persona.emoji}</span>{persona.name}</Badge>
        {question && (
          <Badge variant={question.isFollowUp ? "destructive" : "secondary"} className="gap-1">
            {question.isFollowUp && <MessageSquareText className="h-3 w-3" />}
            {question.isFollowUp ? "Follow-up" : `Q${asked + 1}`} · {question.topic}
          </Badge>
        )}
        {question && (
          <div className="ml-auto flex items-center gap-1.5 text-sm font-mono">
            <Timer className={cn("h-4 w-4", remaining < 30 ? "text-rose-600" : "text-muted-foreground")} />
            <span className={cn(remaining < 30 && "text-rose-600 font-bold")}>
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
      <Progress value={((asked + (phase === "feedback" ? 1 : 0)) / (session?.questionCount ?? 5)) * 100} className="h-1.5" />

      {/* examiner card */}
      <Card className="overflow-hidden">
        <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white/15 grid place-items-center font-display text-xl">{persona.emoji}</div>
          <div>
            <p className="font-semibold leading-tight">{persona.name}</p>
            <p className="text-xs opacity-80 leading-tight">
              {persona.tagline} · strictness {Math.round(persona.strictness * 10)}/10
            </p>
          </div>
          {phase === "loading-question" && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Examiner is preparing…
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {followUpReason && phase === "question" && (
            <p className="mb-3 text-xs text-muted-foreground flex items-center gap-1.5">
              <Flag className="h-3 w-3 text-rose-500" /> Follow-up triggered: {followUpReason}
            </p>
          )}
          {question ? (
            <p className="text-lg font-medium leading-relaxed">{question.questionText}</p>
          ) : phase === "loading-session" || phase === "loading-question" ? (
            <div className="space-y-2 py-2">
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/5 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            <p className="text-muted-foreground">This session has ended.</p>
          )}
          {question && (
            <p className="mt-2 text-xs text-muted-foreground">
              Difficulty context {question.difficulty}/5 · answer by voice or text
            </p>
          )}
        </CardContent>
      </Card>

      {/* answer area */}
      {(phase === "question" || phase === "grading") && question && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <Tabs defaultValue={speech.supported ? "voice" : "text"}>
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="voice" disabled={!speech.supported}>
                  <Mic className="h-3.5 w-3.5 mr-1" /> Voice
                </TabsTrigger>
                <TabsTrigger value="text">Typed</TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-3 pt-3">
                {!speech.supported && (
                  <p className="text-xs text-muted-foreground">
                    Voice input needs Chrome or Edge. Typed input is always available as a fallback.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => (speech.listening ? speech.stop() : speech.start())}
                    className={cn(
                      "h-14 w-14 rounded-full grid place-items-center transition-all",
                      speech.listening ? "bg-rose-600 text-white vm-mic-pulse" : "bg-primary text-primary-foreground hover:scale-105"
                    )}
                    aria-label={speech.listening ? "Stop recording" : "Start recording"}
                  >
                    {speech.listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                  <div className="text-sm">
                    {speech.listening ? (
                      <span className="text-rose-600 font-medium">Listening… speak your answer</span>
                    ) : (
                      <span className="text-muted-foreground">Tap the mic and answer aloud</span>
                    )}
                    {speech.error && <p className="text-xs text-rose-600 mt-0.5">{speech.error}</p>}
                  </div>
                  <div className="ml-auto flex items-center gap-3 text-xs">
                    <span className={cn("flex items-center gap-1 font-semibold", paceColor(speech.liveWpm))}>
                      <Gauge className="h-3.5 w-3.5" /> {speech.liveWpm} WPM
                    </span>
                    <span className="text-muted-foreground">{speech.elapsedSec}s</span>
                    <span className="text-muted-foreground">⏸ {speech.pauses}</span>
                  </div>
                </div>
                <Textarea
                  value={speech.transcript + (speech.interim ? ` ${speech.interim}` : "")}
                  onChange={(e) => speech.setTranscript(e.target.value)}
                  placeholder="Your live transcript appears here — you can edit it before submitting."
                  className="min-h-32 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Live pace target: {DELIVERY_TARGETS.wpmMin}–{DELIVERY_TARGETS.wpmMax} WPM. Fillers (like, basically, you know…)
                  are counted from your transcript. Browser engines may drop “um/uh”, so this measures common spoken fillers and pace,
                  not every disfluency.
                </p>
              </TabsContent>

              <TabsContent value="text" className="space-y-3 pt-3">
                <Textarea
                  value={typed}
                  onChange={(e) => {
                    if (!integrity.current.firstKeystrokeAt) integrity.current.firstKeystrokeAt = Date.now();
                    integrity.current.charsTyped = e.target.value.length;
                    setTyped(e.target.value);
                  }}
                  onPaste={() => {
                    integrity.current.pasted = true;
                    integrity.current.pasteCount += 1;
                  }}
                  placeholder="Type your answer as you would say it…"
                  className="min-h-32 text-sm"
                />
                <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Typing behaviour (paste events, speed) is recorded as an integrity signal for teacher-assigned practice —
                  shown as information, never as an accusation.
                </p>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {speech.listening ? "Stop the mic or submit directly — the transcript is used either way." : "Take a breath, then answer like you would in the real viva."}
              </p>
              <Button onClick={() => submit(false)} disabled={phase === "grading"} className="gap-2">
                {phase === "grading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {phase === "grading" ? "Examiner is evaluating…" : "Submit answer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* feedback screen (C6) */}
      {(phase === "feedback" || phase === "finishing") && eval_ && lastResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              Evaluation
              <Badge variant={eval_.score >= 7 ? "default" : eval_.score >= 5 ? "secondary" : "destructive"}>
                {eval_.score.toFixed(1)} / 10
              </Badge>
              {lastResult.degraded && (
                <Badge variant="outline" className="text-muted-foreground">offline heuristic scoring</Badge>
              )}
              {lastResult.nextAction === "followup" && (
                <Badge variant="destructive" className="gap-1">
                  <MessageSquareText className="h-3 w-3" /> follow-up coming
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* rubric bars */}
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {(Object.entries(eval_.criteria) as [string, number][]).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{k}</span>
                    <span className="font-semibold">{v}/10</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-700", v >= 7 ? "bg-emerald-600" : v >= 5 ? "bg-amber-500" : "bg-rose-600")}
                      style={{ width: `${v * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* key points */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Covered key points
                </p>
                {eval_.coveredKeyPoints.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None detected.</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {eval_.coveredKeyPoints.map((p) => <li key={p} className="flex gap-1.5"><span className="text-emerald-600">✓</span>{p}</li>)}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Missing key points
                </p>
                {eval_.missingKeyPoints.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nothing missing — full coverage.</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {eval_.missingKeyPoints.map((p) => <li key={p} className="flex gap-1.5"><span className="text-rose-600">✗</span>{p}</li>)}
                  </ul>
                )}
              </div>
            </div>

            {/* feedback + model answer */}
            <div className="rounded-xl bg-muted/50 p-3 text-sm">{eval_.feedback}</div>
            {eval_.modelAnswer && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Model answer
                </p>
                <p className="text-sm text-muted-foreground">{eval_.modelAnswer}</p>
              </div>
            )}

            {/* adaptive info */}
            <div className="flex flex-wrap gap-2 text-xs">
              {lastResult.adaptive.changed === "up" && <Badge className="gap-1">📈 difficulty raised to {lastResult.adaptive.difficulty}/5</Badge>}
              {lastResult.adaptive.changed === "down" && <Badge variant="destructive" className="gap-1">📉 difficulty eased to {lastResult.adaptive.difficulty}/5 — next question revisits a prerequisite</Badge>}
              <Badge variant="outline">answered {lastResult.progress.asked} / {lastResult.progress.total}</Badge>
            </div>

            {/* delivery report (E2) */}
            {lastDelivery && (
              <div className="rounded-xl border p-3">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Mic className="h-3.5 w-3.5 text-primary" /> Delivery report
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className={cn("text-lg font-bold", paceColor(lastDelivery.wpm))}>{lastDelivery.wpm}</p>
                    <p className="text-[10px] text-muted-foreground">WPM (target {DELIVERY_TARGETS.wpmMin}–{DELIVERY_TARGETS.wpmMax})</p>
                  </div>
                  <div>
                    <p className={cn("text-lg font-bold", lastDelivery.fillerPerMin < DELIVERY_TARGETS.fillerPerMinMax ? "text-emerald-600" : "text-rose-600")}>
                      {lastDelivery.fillerPerMin}
                    </p>
                    <p className="text-[10px] text-muted-foreground">fillers/min (target &lt; {DELIVERY_TARGETS.fillerPerMinMax})</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{lastDelivery.pauses}</p>
                    <p className="text-[10px] text-muted-foreground">long pauses (&gt; {DELIVERY_TARGETS.pauseSec}s)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{lastDelivery.wordCount}</p>
                    <p className="text-[10px] text-muted-foreground">words in {lastDelivery.durationSec}s</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Browser speech engines may drop “um/uh” — this measures common spoken fillers and pace, not every disfluency.
                </p>
              </div>
            )}

            {/* integrity note (E8) */}
            {lastIntegrity && lastIntegrity.pasted && (
              <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-xs flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Integrity note (informational, not an accusation): this typed answer included {lastIntegrity.pasteCount} paste
                  event{lastIntegrity.pasteCount === 1 ? "" : "s"} at ~{lastIntegrity.cps} chars/sec — much faster than typing.
                  Teachers can see this flag in class analytics.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {lastResult.nextAction === "done" ? (
                <Button onClick={finish} disabled={phase === "finishing"} className="gap-2">
                  {phase === "finishing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {phase === "finishing" ? "Building report…" : "Finish & see report"}
                </Button>
              ) : (
                <Button onClick={fetchQuestion} className="gap-2">
                  {lastResult.nextAction === "followup" ? "Face the follow-up →" : "Next question →"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(phase === "done" || phase === "finishing") && !eval_ && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-lg font-semibold">That&apos;s all the questions for this session.</p>
            <p className="text-sm text-muted-foreground">Finish to generate your report, flashcards and updated readiness index.</p>
            <Button onClick={finish} disabled={phase === "finishing"} className="gap-2">
              {phase === "finishing" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {phase === "finishing" ? "Building report…" : "Build my report"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
