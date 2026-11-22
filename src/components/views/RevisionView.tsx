// Revision — flashcard review with Again / Hard / Good / Easy buttons (E5)

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "@/store/app";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Repeat2, Eye, Loader2, CalendarClock, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

interface Card2 {
  id: string;
  topic: string;
  front: string;
  back: string;
  ef: number;
  intervalDays: number;
  repetitions: number;
  dueDate: string;
}

interface TodayData {
  due: Card2[];
  dueCount: number;
  upcoming: number;
  reviewedToday: number;
}

export default function RevisionView() {
  const bumpRevision = useApp((s) => s.bumpRevision);
  const { toast } = useToast();
  const [data, setData] = useState<TodayData | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  async function load() {
    const d = await api<TodayData>("/api/revision/today");
    setData(d);
    setIndex(0);
    setRevealed(false);
  }

  useEffect(() => {
    void load().catch(() => setData({ due: [], dueCount: 0, upcoming: 0, reviewedToday: 0 }));
  }, []);

  async function grade(g: "again" | "hard" | "good" | "easy") {
    if (!data || !data.due[index]) return;
    setGrading(true);
    try {
      const res = await api<{ message: string }>(`/api/revision/${data.due[index].id}/review`, {
        method: "POST",
        body: JSON.stringify({ grade: g }),
      });
      setLastMessage(res.message);
      bumpRevision();
      const next = data.due.slice(1);
      setData({ ...data, due: next, dueCount: next.length, reviewedToday: data.reviewedToday + 1 });
      setRevealed(false);
      setIndex(0);
    } catch (err) {
      toast({ title: "Review failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setGrading(false);
    }
  }

  if (!data) {
    return <div className="py-20 text-center text-muted-foreground">Loading today&apos;s revision…</div>;
  }

  const total = data.dueCount;
  const done = data.reviewedToday;
  const card = data.due[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Repeat2 className="h-6 w-6 text-primary" /> Today&apos;s revision
          </h1>
          <p className="text-sm text-muted-foreground">
            Missed key points from your sessions, scheduled by SM-2 spaced repetition.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="gap-1"><CalendarClock className="h-3 w-3" /> {data.upcoming} upcoming</Badge>
          <Badge variant="outline">{done} reviewed today</Badge>
        </div>
      </div>

      {lastMessage && (
        <p className="text-xs text-center text-emerald-600">{lastMessage}</p>
      )}

      {total === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <PartyPopper className="h-10 w-10 mx-auto text-primary" />
            <p className="font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No cards are due today. New cards appear automatically after each session&apos;s weak answers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Progress value={(done / Math.max(1, done + total)) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{total} card{total === 1 ? "" : "s"} due now</p>

          <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="min-h-64">
              <CardContent className="p-6 flex flex-col">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <Badge variant="secondary">{card.topic}</Badge>
                  <span>
                    seen {card.repetitions}× · ease {card.ef.toFixed(2)} · due since{" "}
                    {new Date(card.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-lg font-medium flex-1">{card.front}</p>

                {revealed ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl bg-muted/60 border p-4">
                    <p className="text-sm">{card.back}</p>
                  </motion.div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-4">
                    Recall the answer out loud, then reveal — honest grading makes the schedule accurate.
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {!revealed ? (
                    <Button onClick={() => setRevealed(true)} className="gap-2">
                      <Eye className="h-4 w-4" /> Reveal answer
                    </Button>
                  ) : (
                    <>
                      <Button variant="destructive" onClick={() => grade("again")} disabled={grading}>
                        {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Again"} <span className="text-[10px] opacity-70">&lt;1d</span>
                      </Button>
                      <Button variant="outline" onClick={() => grade("hard")} disabled={grading}>
                        Hard <span className="text-[10px] opacity-70">1d</span>
                      </Button>
                      <Button variant="outline" className="border-emerald-600/40 text-emerald-700" onClick={() => grade("good")} disabled={grading}>
                        Good <span className="text-[10px] opacity-70">6d</span>
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => grade("easy")} disabled={grading}>
                        Easy <span className="text-[10px] opacity-70">×EF</span>
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  Again restarts the card · Hard = q3 · Good = q4 · Easy = q5 (SM-2: EF = EF + (0.1 − (5−q)(0.08 + (5−q)·0.02)), min 1.3)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
