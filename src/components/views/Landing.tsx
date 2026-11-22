// Landing — the VivaMentor product page.
// A market-ready site says what it does, shows the product, proves it,
// answers questions, and lets you in. The voice is calm and confident;
// the motion is choreographed — every card section moves to its own
// scroll: the steps travel a pinned rail west→east, the delivery
// metrics rise as a wave, the personas stack like a deck, the stats
// converge inward. Two themes: ink (default) and paper, switched from
// the header. A short preloader opens with a single diagonal sweep of
// light and hands over to the hero.

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import Link from "next/link";
import { useApp } from "@/store/app";
import { roleHome } from "@/lib/roles";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Preloader from "@/components/landing/Preloader";

const INK = "var(--vl-bg)";
const CHALK = "var(--vl-chalk)";
const BRASS = "var(--vl-brass)";

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--vl-brass)]">
      {children}
    </p>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
  force = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  force?: boolean;
}) {
  if (force) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* media query hook — false during SSR, settled after mount */
function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/* a number that arrives — counts up once it scrolls into view */
function CountUp({
  to,
  format,
  duration = 1.5,
}: {
  to: number;
  format: (v: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-18% 0px" });
  const [text, setText] = useState(() => format(0));

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => setText(format(v)),
    });
    return () => c.stop();
  }, [inView, reduce, to, duration, format]);

  return (
    <span ref={ref} className="tabular-nums">
      {reduce ? format(to) : text}
    </span>
  );
}

/* wordmark mark — a small rotated brass frame with a centre dot */
function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative block h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rotate-45 rounded-[2px] border border-[var(--vl-brass)]" />
      <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--vl-brass)]" />
    </span>
  );
}

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

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
    </svg>
  );
}

function ThemeToggle({ day, onToggle }: { day: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={day}
      aria-label={day ? "Switch to dark theme" : "Switch to light theme"}
      title={day ? "Switch to dark theme" : "Switch to light theme"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--vl-chalk)]/15 text-[var(--vl-chalk)]/60 transition-colors hover:border-[var(--vl-chalk)]/35 hover:text-[var(--vl-chalk)]"
    >
      {day ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* nav                                                                 */
/* ------------------------------------------------------------------ */

const NAV_LINKS: [string, string][] = [
  ["Why", "#why"],
  ["How it works", "#how-it-works"],
  ["Product", "#product"],
  ["For faculty", "#faculty"],
  ["FAQ", "#faq"],
];

function Nav({
  intro,
  day,
  onToggle,
  authedRole,
}: {
  intro: boolean;
  day: boolean;
  onToggle: () => void;
  authedRole: string | null;
}) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: intro ? 1 : 0 }}
      transition={{ duration: 0.8, delay: 0.15 }}
      className={`fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
        solid
          ? "border-[var(--vl-chalk)]/10 backdrop-blur-xl"
          : "border-transparent"
      }`}
      style={{
        background: solid
          ? "color-mix(in srgb, var(--vl-bg) 74%, transparent)"
          : "transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="VivaMentor home">
          <Mark />
          <span className="font-display text-lg tracking-tight" style={{ color: CHALK }}>
            VivaMentor
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/55 transition-colors hover:text-[var(--vl-chalk)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle day={day} onToggle={onToggle} />
          {authedRole ? (
            <Link
              href={roleHome(authedRole)}
              className="rounded-lg bg-[var(--vl-brass)] px-4 py-2 text-[13px] font-semibold text-[var(--vl-bg)] transition-colors hover:bg-[var(--vl-brass-hi)]"
            >
              Open workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/60 transition-colors hover:text-[var(--vl-chalk)] sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[var(--vl-brass)] px-4 py-2 text-[13px] font-semibold text-[var(--vl-bg)] transition-colors hover:bg-[var(--vl-brass-hi)]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/* hero                                                                */
/* ------------------------------------------------------------------ */

function Meter({
  label,
  value,
  scale,
}: {
  label: string;
  value: number;
  scale: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/45">
          {label}
        </p>
        <p className="font-mono text-[11px] tabular-nums text-[var(--vl-chalk)]/70">
          {value}/10
        </p>
      </div>
      <div className="mt-1.5 h-[3px] w-full rounded-full bg-[var(--vl-chalk)]/10">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: scale }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
          className="h-full w-full origin-left rounded-full bg-[var(--vl-brass)]"
        />
      </div>
    </div>
  );
}

/* the product, shown honestly: a window into the interview room */
function ProductWindow() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* ambient light under the window */}
      <div
        className="absolute -inset-x-6 top-10 bottom-0 rounded-[36px] opacity-80"
        style={{ background: "radial-gradient(58% 58% at 50% 42%, var(--vl-glow), transparent 72%)" }}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/85 shadow-[0_60px_120px_-40px_var(--vl-shadow)] backdrop-blur-md">
        {/* window title bar */}
        <div className="flex items-center gap-3 border-b border-[var(--vl-chalk)]/8 px-5 py-3.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--vl-chalk)]/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--vl-chalk)]/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--vl-chalk)]/15" />
          </div>
          <p className="mx-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/40">
            vivamentor · interview room
          </p>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-red)]">
            <span className="vm-dot h-1.5 w-1.5 rounded-full bg-current" />
            live
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.65fr_1fr]">
          {/* the examination */}
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/45">
                DBMS · Transactions · Q4
              </p>
              <p className="font-mono text-[11px] tabular-nums text-[var(--vl-brass)]">
                01:47 / 02:00
              </p>
            </div>

            <p className="mt-5 font-display text-xl leading-snug md:text-[1.45rem]" style={{ color: CHALK }}>
              Explain how two-phase locking works — and what it has to do with
              deadlocks.
            </p>

            <div className="mt-6 border-l-2 border-[var(--vl-brass)]/60 pl-5">
              <p className="text-[15px] leading-relaxed text-[var(--vl-chalk)]/75">
                &ldquo;In two-phase locking, a transaction acquires all the locks it
                needs in a growing phase, then releases them in a shrinking
                phase. Deadlocks can occur when two transactions each hold a lock
                the other wants…&rdquo;
                <span className="vm-caret text-[var(--vl-brass)]">▌</span>
              </p>
              <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-steel)]">
                transcribing live · 142 wpm
              </p>
            </div>

            <div className="mt-7 flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--vl-brass)] text-[var(--vl-bg)]">
                <MicIcon />
              </span>
              <p className="text-[13px] text-[var(--vl-chalk)]/55">
                Answer out loud — or type, any time
              </p>
            </div>
          </div>

          {/* live scoring rail */}
          <div className="border-t border-[var(--vl-chalk)]/8 p-6 md:p-7 lg:border-l lg:border-t-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/45">
              rubric · live
            </p>
            <div className="mt-4 space-y-3.5">
              <Meter label="Correctness" value={9} scale={0.9} />
              <Meter label="Completeness" value={9} scale={0.9} />
              <Meter label="Clarity" value={8} scale={0.8} />
              <Meter label="Depth" value={8} scale={0.8} />
            </div>

            <div className="mt-6 space-y-2 border-t border-[var(--vl-chalk)]/8 pt-5">
              {[
                ["pace", "142 wpm"],
                ["pauses", "2 over 2s"],
                ["fillers", "4"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/40">
                    {k}
                  </p>
                  <p className="font-mono text-[11px] tabular-nums text-[var(--vl-chalk)]/75">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ intro, authedRole }: { intro: boolean; authedRole: string | null }) {
  const { scrollY } = useScroll();
  const winY = useTransform(scrollY, [0, 800], [0, -34]);

  const line = {
    hidden: { y: "108%" },
    show: (i: number) => ({
      y: 0,
      transition: { duration: 1.05, delay: 0.15 + i * 0.13, ease: EASE },
    }),
  };

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: intro ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <Eyebrow>AI-powered viva &amp; interview practice</Eyebrow>
          </motion.div>

          <h1
            className="mt-6 font-display text-[clamp(2.15rem,6.6vw,4.9rem)] leading-[1.05] tracking-tight"
            style={{ color: CHALK }}
          >
            <span className="block overflow-hidden pb-1">
              <motion.span custom={0} variants={line} initial="hidden" animate={intro ? "show" : "hidden"} className="block text-balance">
                Walk into every viva
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span custom={1} variants={line} initial="hidden" animate={intro ? "show" : "hidden"} className="block text-balance">
                already <em className="text-[var(--vl-brass)]">rehearsed.</em>
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={intro ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--vl-chalk)]/60 md:text-base"
          >
            VivaMentor is an AI examiner that asks subject-specific questions,
            listens to your spoken answers, probes the weak points and scores
            you against a transparent rubric — then schedules your revision
            until it sticks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={intro ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.8, delay: 0.78 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href={authedRole ? roleHome(authedRole) : "/register"}
              className="rounded-lg bg-[var(--vl-brass)] px-6 py-3 text-sm font-semibold text-[var(--vl-bg)] transition-colors hover:bg-[var(--vl-brass-hi)]"
            >
              {authedRole ? "Open your workspace" : "Start practicing"}
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-[var(--vl-chalk)]/25 px-6 py-3 text-sm font-medium text-[var(--vl-chalk)]/80 transition-colors hover:border-[var(--vl-chalk)]/50 hover:text-[var(--vl-chalk)]"
            >
              See how it works
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: intro ? 1 : 0 }}
            transition={{ duration: 0.9, delay: 1.05 }}
            className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/45"
          >
            Free to start · voice transcribed in your browser · Chrome &amp; Edge recommended
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 46 }}
          animate={intro ? { opacity: 1, y: 0 } : { opacity: 0, y: 46 }}
          transition={{ duration: 1, delay: 0.45, ease: EASE }}
          style={{ y: winY }}
          className="mt-14 md:mt-20"
        >
          <ProductWindow />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* stats band                                                          */
/* ------------------------------------------------------------------ */

const STATS = [
  {
    v: "3",
    l: "examiner personas",
    d: "Friendly, strict and rapid-fire — practice for the room you will actually face.",
  },
  {
    v: "4",
    l: "rubric criteria",
    d: "Correctness, completeness, clarity, depth — every score shows its working.",
  },
  {
    v: "SM-2",
    l: "spaced repetition",
    d: "Missed points return as flashcards on a proven review schedule.",
  },
  {
    v: "100%",
    l: "in-browser voice",
    d: "Speech recognition, when available, runs in your browser; this demo does not send data to a server.",
  },
];

/* one cell of the stats band — drifts in from the band's edge,
   scrubbed by scroll, so the row converges toward its centre */
function SettleCell({
  i,
  className = "",
  children,
}: {
  i: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.98", "start 0.58"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [i % 2 === 0 ? -36 : 36, 0]);
  const o = useTransform(scrollYProgress, [0, 0.65], [0, 1]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={reduce ? undefined : { x, opacity: o }} className="h-full">
        {children}
      </motion.div>
    </div>
  );
}

function StatsBand() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.55"],
  });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} className="relative border-y border-[var(--vl-chalk)]/8">
      {/* the light passes along the top edge as the band arrives */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-px origin-left bg-[var(--vl-brass)]/50"
          style={{ scaleX: line }}
        />
      )}
      <div className="mx-auto grid max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <SettleCell
            key={s.l}
            i={i}
            className={`border-[var(--vl-chalk)]/8 px-6 py-8 ${
              i > 0 ? "border-t sm:border-t-0 sm:border-l" : ""
            } ${i === 2 ? "sm:border-t lg:border-t-0" : ""} ${i === 3 ? "sm:border-t lg:border-t-0 sm:border-l" : ""}`}
          >
            <p className="font-display text-[2.6rem] leading-none" style={{ color: CHALK }}>
              {s.v}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-brass)]">
              {s.l}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--vl-chalk)]/50">{s.d}</p>
          </SettleCell>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* why                                                                 */
/* ------------------------------------------------------------------ */

function WhyScene() {
  const rows = [
    [
      "Students never speak it",
      "Notes get re-read; answers stay unspoken until the real viva is the first time the words come out.",
    ],
    [
      "Faculty cannot scale mocks",
      "One-to-one practice for every student, every week, is beyond any department's hours.",
    ],
    [
      "Chatbots do not examine",
      "They answer questions. They do not probe weak points, time you, score you, or remember what to revisit.",
    ],
  ] as const;

  return (
    <section id="why" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Eyebrow>Why VivaMentor</Eyebrow>
            <h2
              className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
              style={{ color: CHALK }}
            >
              Reading is not <em className="text-[var(--vl-brass)]">rehearsing.</em>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
              A viva tests what you can say out loud, under pressure, in your own
              words. Almost nobody practices that part — because until now, there
              was no one to practice with.
            </p>
          </Reveal>
        </div>

        <div>
          {rows.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="flex gap-6 border-t border-[var(--vl-chalk)]/10 py-7">
                <p className="pt-0.5 font-mono text-[11px] tabular-nums text-[var(--vl-brass)]/80">
                  0{i + 1}
                </p>
                <div>
                  <h3 className="font-display text-xl" style={{ color: CHALK }}>
                    {t}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--vl-chalk)]/55">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.28}>
            <p className="border-t border-[var(--vl-chalk)]/10 pt-7 text-[15px] leading-relaxed text-[var(--vl-chalk)]/75">
              VivaMentor is built for exactly this gap — an examiner that is
              always available, always probing, and never bored.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* how it works — a pinned horizontal journey, west → east             */
/* ------------------------------------------------------------------ */

const HOW_STEPS = [
  {
    n: "01",
    title: "Set the room",
    desc: "Pick your subject and examiner persona. Upload a syllabus or project document, and document-aware mode examines you on your own material.",
  },
  {
    n: "02",
    title: "Answer out loud",
    desc: "Speak as you would in the real room. Answers are transcribed in your browser; weak answers get cross-questioned, strong ones raise the difficulty.",
  },
  {
    n: "03",
    title: "Fix what the report shows",
    desc: "Rubric scores with covered and missed points, a model answer, delivery analytics — and flashcards scheduled until it sticks.",
  },
] as const;

const JOURNEY_LABELS = ["Set the room", "Answer out loud", "Fix what the report shows"];

/* deterministic waveform — the shape of a spoken answer */
const WAVE = [38, 62, 45, 80, 58, 92, 70, 48, 85, 60, 74, 40, 88, 55, 68, 95, 50, 72, 42, 78, 64, 90, 46, 82, 58, 70, 36, 76, 52, 66];

const SETUP_ROWS: [string, string][] = [
  ["subject", "DBMS · Transactions"],
  ["examiner", "The Strict External"],
  ["material", "syllabus.pdf — document-aware"],
];

const VERDICT_BARS: [string, number][] = [
  ["Correctness", 0.9],
  ["Completeness", 0.9],
  ["Clarity", 0.8],
  ["Depth", 0.8],
];

function StepDetail({ n }: { n: string }) {
  if (n === "01") {
    return (
      <div className="rounded-lg border border-[var(--vl-chalk)]/10 bg-[var(--vl-panel-2)] px-5 py-3.5">
        {SETUP_ROWS.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-6 border-b border-[var(--vl-chalk)]/8 py-2.5 first:pt-0.5 last:border-0 last:pb-0.5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/40">{k}</p>
            <p className="text-right text-[13px] text-[var(--vl-chalk)]/80">{v}</p>
          </div>
        ))}
      </div>
    );
  }

  if (n === "02") {
    return (
      <div className="rounded-lg border border-[var(--vl-chalk)]/10 bg-[var(--vl-panel-2)] px-5 py-4">
        <div className="flex h-10 items-center gap-[3px]">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="vm-wave w-[3px] shrink-0 rounded-full bg-[var(--vl-brass)]/70"
              style={{ height: `${h}%`, animationDelay: `${i * 0.09}s` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/45">
          transcribing live · 142 wpm · audio never leaves your browser
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--vl-chalk)]/10 bg-[var(--vl-panel-2)] px-5 py-4">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-3xl leading-none text-[var(--vl-brass)]">8.4</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/45">
          weighted · rubric 4 / 4
        </p>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2.5">
        {VERDICT_BARS.map(([label, v]) => (
          <div key={label}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--vl-chalk)]/45">{label}</p>
              <p className="font-mono text-[10px] tabular-nums text-[var(--vl-chalk)]/70">{v * 10}/10</p>
            </div>
            <div className="mt-1 h-[3px] w-full rounded-full bg-[var(--vl-chalk)]/10">
              <div className="h-full rounded-full bg-[var(--vl-brass)]" style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--vl-chalk)]/45">
        1 missed point → flashcard · first review in 1 day
      </p>
    </div>
  );
}

function JourneyPanel({ n, title, desc, wide = false }: { n: string; title: string; desc: string; wide?: boolean }) {
  return (
    <article
      className={`flex shrink-0 flex-col justify-between gap-7 rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/85 p-6 shadow-[0_50px_100px_-48px_var(--vl-shadow)] backdrop-blur-md sm:p-8 ${
        wide ? "w-full" : "h-[min(64vh,26rem)] w-[86vw] max-w-[34rem] lg:w-[44rem] lg:max-w-none lg:p-9"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[11px] tabular-nums text-[var(--vl-brass)]">Step {n}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/35">
          viva session
        </p>
      </div>
      <div>
        <h3
          className="font-display text-[clamp(1.65rem,2.6vw,2.3rem)] leading-tight"
          style={{ color: CHALK }}
        >
          {title}
        </h3>
        <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-[var(--vl-chalk)]/60 md:text-[15px]">
          {desc}
        </p>
      </div>
      <StepDetail n={n} />
    </article>
  );
}

/* one label along the rail — lights up as its step arrives */
function RailLabel({ label, p, i }: { label: string; p: MotionValue<number>; i: number }) {
  const o = useTransform(p, [0.02 + i * 0.32, 0.14 + i * 0.32], [0.35, 1]);
  return (
    <motion.span
      style={{ opacity: o }}
      className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]"
    >
      {label}
    </motion.span>
  );
}

/* the pinned journey — desktop only; smaller screens and reduced-motion
   get a vertical telling of the same three steps */
function HowJourney() {
  const ref = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      const v = viewRef.current;
      if (!t || !v) return;
      setDist(Math.max(0, t.scrollWidth - v.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(p, [0.04, 0.96], [0, -dist]);
  const fill = useTransform(p, [0.04, 0.96], [0, 1]);

  useMotionValueEvent(p, "change", (v) => {
    const s = v < 0.38 ? 0 : v < 0.72 ? 1 : 2;
    setStep((prev) => (prev === s ? prev : s));
  });

  return (
    <section id="how-it-works" ref={ref} className="relative h-[300vh] border-t border-[var(--vl-chalk)]/8">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden py-20">
        {/* header */}
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-6">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2
              className="mt-5 font-display text-[clamp(2rem,4.2vw,3.1rem)] leading-[1.06] tracking-tight"
              style={{ color: CHALK }}
            >
              Three steps to a steadier viva.
            </h2>
          </div>
          <p className="hidden shrink-0 pb-1.5 font-mono text-[11px] tabular-nums text-[var(--vl-brass)] sm:block">
            0{step + 1} <span className="text-[var(--vl-chalk)]/40">/ 03</span>
          </p>
        </div>

        {/* the travelling track */}
        <div ref={viewRef} className="relative mt-9 flex-1">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex h-full w-max items-center gap-6 pl-[max(1.5rem,calc((100vw-72rem)/2))] pr-[12vw] will-change-transform"
          >
            {HOW_STEPS.map((s) => (
              <JourneyPanel key={s.n} n={s.n} title={s.title} desc={s.desc} />
            ))}
          </motion.div>
          {/* the track dissolves at both edges */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16"
            style={{ background: "linear-gradient(to right, var(--vl-bg), transparent)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16"
            style={{ background: "linear-gradient(to left, var(--vl-bg), transparent)" }}
            aria-hidden="true"
          />
        </div>

        {/* the rail — draws west to east with the journey */}
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="relative h-px w-full bg-[var(--vl-chalk)]/12">
            <motion.div
              className="absolute inset-0 origin-left bg-[var(--vl-brass)]"
              style={{ scaleX: fill }}
            />
          </div>
          <div className="mt-3.5 flex items-center justify-between gap-4">
            {JOURNEY_LABELS.map((l, i) => (
              <RailLabel key={l} label={l} p={p} i={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowStacked({ reduce }: { reduce: boolean }) {
  return (
    <section id="how-it-works" className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl" force={reduce}>
          <Eyebrow>How it works</Eyebrow>
          <h2
            className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
            style={{ color: CHALK }}
          >
            Three steps to a steadier viva.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6">
          {HOW_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06} force={reduce}>
              <JourneyPanel n={s.n} title={s.title} desc={s.desc} wide />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowScene() {
  const isDesktop = useMedia("(min-width: 1024px)");
  const reduce = useReducedMotion();
  if (isDesktop && !reduce) return <HowJourney />;
  return <HowStacked reduce={!!reduce} />;
}

/* ------------------------------------------------------------------ */
/* the session — one scroll-told sequence, question → verdict          */
/* ------------------------------------------------------------------ */

const SESSION_STEPS: [string, string, number, number][] = [
  ["The question", "Subject, topic and difficulty — drawn from the verified bank or generated fresh.", 0.03, 0.16],
  ["Your spoken answer", "Transcribed live on your device; delivery metrics measured as you speak.", 0.18, 0.34],
  ["The rubric", "Four criteria with the exact key points covered — and the ones missed.", 0.36, 0.54],
  ["The verdict", "A weighted score, a model answer, and a follow-up when something is missing.", 0.58, 0.95],
];

/* one step of the telling — brightens as its range arrives, fills its rule */
function useStepGlow(p: MotionValue<number>, a: number, b: number) {
  const lo = Math.max(0, a - 0.05);
  const hi = Math.min(1, b + 0.04);
  const o = useTransform(p, [lo, a, b, hi], [0.5, 1, 1, 0.5]);
  const oBody = useTransform(p, [lo, a, b, hi], [0.68, 1, 1, 0.68]);
  const fill = useTransform(p, [a, b], [0, 1]);
  return { o, oBody, fill };
}

function SessionScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // the card assembles
  const cardY = useTransform(p, [0.03, 0.12], [54, 0]);
  const cardO = useTransform(p, [0.03, 0.1], [0, 1]);

  const ansO = useTransform(p, [0.18, 0.26], [0, 1]);
  const ansY = useTransform(p, [0.18, 0.26], [18, 0]);

  const rubO = useTransform(p, [0.36, 0.44], [0, 1]);
  const barA = useTransform(p, [0.38, 0.48], [0, 0.9]);
  const barB = useTransform(p, [0.41, 0.51], [0, 0.9]);
  const barC = useTransform(p, [0.44, 0.54], [0, 0.8]);
  const barD = useTransform(p, [0.47, 0.57], [0, 0.8]);

  const scoreO = useTransform(p, [0.58, 0.66], [0, 1]);
  const rawScore = useTransform(p, [0.58, 0.72], [0, 8.4]);
  const scoreText = useTransform(rawScore, (v) => v.toFixed(1));

  const noteO = useTransform(p, [0.74, 0.82], [0, 1]);

  const stepAnim = [
    useStepGlow(p, 0.03, 0.16),
    useStepGlow(p, 0.18, 0.34),
    useStepGlow(p, 0.36, 0.54),
    useStepGlow(p, 0.58, 0.95),
  ];

  return (
    <section id="product" ref={ref} className="relative h-[200vh] border-t border-[var(--vl-chalk)]/8">
      <div className="sticky top-0 flex h-screen items-start overflow-hidden lg:items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-8 pt-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-8">
          {/* the telling, step by step */}
          <div className="hidden lg:flex lg:flex-col lg:gap-9">
            <div>
              <Eyebrow>Inside a session</Eyebrow>
              <h2
                className="mt-5 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.08] tracking-tight"
                style={{ color: CHALK }}
              >
                From first question to final score.
              </h2>
            </div>

            {SESSION_STEPS.map(([t, d], i) => (
              <div key={t} className="flex gap-5">
                <p className="pt-1 font-mono text-[11px] tabular-nums text-[var(--vl-brass)]/80">
                  0{i + 1}
                </p>
                <div>
                  <motion.h3
                    style={{ opacity: stepAnim[i].o }}
                    className="font-display text-lg leading-snug"
                  >
                    <span style={{ color: CHALK }}>{t}</span>
                  </motion.h3>
                  <motion.p
                    style={{ opacity: stepAnim[i].oBody }}
                    className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--vl-chalk)]/60"
                  >
                    {d}
                  </motion.p>
                  <div className="mt-3 h-px w-44 max-w-full bg-[var(--vl-chalk)]/12">
                    <motion.div
                      style={{ scaleX: stepAnim[i].fill }}
                      className="h-full w-full origin-left bg-[var(--vl-brass)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* the report, assembling */}
          <motion.div
            style={{ y: cardY, opacity: cardO }}
            className="mx-auto w-full max-w-xl"
          >
            <div className="rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/90 p-4 shadow-[0_50px_100px_-40px_var(--vl-shadow)] backdrop-blur-md sm:p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--vl-chalk)]/10 pb-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/45">
                  DBMS · Transactions · Q4
                </p>
                <p className="font-mono text-[10px] tabular-nums text-[var(--vl-steel)]">
                  00:38 / 02:00
                </p>
              </div>

              <p className="mt-3.5 font-display text-lg leading-snug sm:mt-4 sm:text-xl md:text-[1.35rem]" style={{ color: CHALK }}>
                Explain how two-phase locking works — and what it has to do with
                deadlocks.
              </p>

              <motion.div style={{ opacity: ansO, y: ansY }} className="mt-4 border-l-2 border-[var(--vl-brass)]/60 pl-4 sm:mt-6 sm:pl-5">
                <p className="text-[13px] leading-relaxed text-[var(--vl-chalk)]/70 sm:text-sm">
                  &ldquo;In two-phase locking, a transaction acquires all the locks it
                  needs in a growing phase, then releases them in a shrinking
                  phase. Deadlocks can occur when two transactions each hold a
                  lock the other wants…&rdquo;
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-steel)]">
                  spoken · transcribed in-browser · 142 wpm
                </p>
              </motion.div>

              <motion.div style={{ opacity: rubO }} className="mt-5 grid gap-x-5 gap-y-3 sm:mt-7 sm:gap-x-6 sm:gap-y-4 sm:grid-cols-2">
                {(
                  [
                    ["Correctness", barA, "9/10"],
                    ["Completeness", barB, "9/10"],
                    ["Clarity", barC, "8/10"],
                    ["Depth", barD, "8/10"],
                  ] as [string, MotionValue<number>, string][]
                ).map(([label, mv, val]) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/45">
                        {label}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--vl-chalk)]/70">{val}</p>
                    </div>
                    <div className="mt-1.5 h-[3px] w-full rounded-full bg-[var(--vl-chalk)]/10">
                      <motion.div
                        style={{ scaleX: mv }}
                        className="h-full w-full origin-left rounded-full bg-[var(--vl-brass)]"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                style={{ opacity: scoreO }}
                className="mt-5 flex items-baseline gap-4 border-t border-[var(--vl-chalk)]/10 pt-3.5 sm:mt-7 sm:pt-5"
              >
                <p className="font-display text-4xl leading-none text-[var(--vl-brass)] sm:text-5xl">
                  <motion.span className="tabular-nums">{scoreText}</motion.span>
                </p>
                <p className="text-xs leading-relaxed text-[var(--vl-chalk)]/50">
                  weighted score — 0.4 × correctness + 0.25 × completeness
                  <br />
                  + 0.2 × clarity + 0.15 × depth
                </p>
              </motion.div>

              <motion.div
                style={{ opacity: noteO }}
                className="mt-3 flex items-start gap-3 rounded-lg border border-[var(--vl-red)]/25 bg-[var(--vl-red)]/[0.07] px-3.5 py-2.5 sm:mt-5 sm:px-4 sm:py-3"
              >
                <p className="text-xs leading-relaxed text-[var(--vl-chalk)]/75 sm:text-[13px]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-red)]">
                    missed key point · referential integrity —{" "}
                  </span>
                  a targeted follow-up was generated, and the point is now a
                  flashcard in your revision plan.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* delivery analytics — columns rise as you scroll, bottom → top       */
/* ------------------------------------------------------------------ */

const DELIVERY = [
  {
    v: 142,
    fmt: (n: number) => String(Math.round(n)),
    u: "wpm",
    t: "target 110–160",
    d: "Speaking pace, from word-level timestamps.",
  },
  {
    v: 2,
    fmt: (n: number) => String(Math.round(n)),
    u: "pauses",
    t: "over 2 seconds",
    d: "Long silences that read as hesitation.",
  },
  {
    v: 4,
    fmt: (n: number) => String(Math.round(n)),
    u: "fillers",
    t: "under 5 / min",
    d: "Common spoken fillers, counted from your transcript.",
  },
  {
    v: 52,
    fmt: (n: number) => `0:${String(Math.round(n)).padStart(2, "0")}`,
    u: "length",
    t: "per answer",
    d: "Answer duration, tracked across the session.",
  },
];

/* one metric column — rises from below at its own rate, so the row
   arrives as a wave; the number counts up as it settles */
function DeliveryCell({
  item,
  i,
  className = "",
}: {
  item: (typeof DELIVERY)[number];
  i: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.97", "start 0.55"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [96 + i * 30, 0]);
  const o = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
  const tick = useTransform(scrollYProgress, [0.25, 0.85], [0, 1]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={reduce ? undefined : { y, opacity: o }}>
        <p
          className="font-display text-[clamp(2.6rem,4.6vw,3.6rem)] leading-none"
          style={{ color: CHALK }}
        >
          <CountUp to={item.v} format={item.fmt} />
          <span className="ml-2 font-mono text-xs lowercase tracking-[0.14em] text-[var(--vl-chalk)]/40">
            {item.u}
          </span>
        </p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-brass)]">
          {item.t}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--vl-chalk)]/50">{item.d}</p>
        <div className="mt-5 h-px w-24 bg-[var(--vl-chalk)]/12">
          <motion.div
            className="h-full w-full origin-left bg-[var(--vl-brass)]"
            style={reduce ? undefined : { scaleX: tick }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function DeliveryScene() {
  return (
    <section className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Delivery analytics</Eyebrow>
          <h2
            className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
            style={{ color: CHALK }}
          >
            Interviews are judged on <em className="text-[var(--vl-brass)]">how</em> you
            speak, as well as what you say.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
            Every session measures the delivery signals an examiner notices
            first — pace, pauses, fillers and length — so you can train them
            deliberately, not guess at them.
          </p>
        </Reveal>

        <div className="mt-14 grid border-[var(--vl-chalk)]/10 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {DELIVERY.map((it, i) => (
            <DeliveryCell
              key={it.u}
              item={it}
              i={i}
              className={`border-t border-[var(--vl-chalk)]/10 py-8 sm:px-7 ${i > 0 ? "" : "sm:pl-0"} ${i === 3 ? "sm:border-t lg:border-t-0" : ""} ${i === 2 ? "sm:border-t lg:border-t-0" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* readiness index                                                     */
/* ------------------------------------------------------------------ */

function ReadinessScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const c = animate(0, 74, {
      duration: 1.7,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => c.stop();
  }, [inView]);

  return (
    <section id="readiness" className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <Eyebrow>Readiness index</Eyebrow>
            <h2
              className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
              style={{ color: CHALK }}
            >
              One number that shows where you stand.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
              Every topic is weighted by importance; strength is an exponential
              moving average of your recent scores, scaled by coverage — so
              untested topics cannot look strong. The result is a single,
              defensible readiness score per subject, banded red, amber or
              green.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/50">
              weakest topics — fix these first
            </p>
            <div className="mt-3 max-w-md">
              {([
                ["Transactions", 48],
                ["Recovery & WAL", 56],
                ["Indexing", 61],
              ] as [string, number][]).map(([t, v]) => (
                <div key={t} className="flex items-center gap-4 border-b border-[var(--vl-chalk)]/10 py-2.5">
                  <p className="w-40 text-sm text-[var(--vl-chalk)]/80">{t}</p>
                  <div className="h-[3px] flex-1 rounded-full bg-[var(--vl-chalk)]/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${v}%`, background: "var(--vl-red)" }}
                    />
                  </div>
                  <p className="w-10 text-right font-mono text-[11px] tabular-nums text-[var(--vl-chalk)]/45">
                    {(v / 10).toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* the dial */}
        <Reveal delay={0.1} className="flex justify-center">
          <div ref={ref} className="relative flex flex-col items-center">
            <svg width="300" height="300" viewBox="0 0 300 300" role="img" aria-label="Readiness score: 74 of 100, amber band">
              {Array.from({ length: 25 }).map((_, i) => {
                const a = (-120 + (240 * i) / 24) * (Math.PI / 180);
                const x1 = 150 + 128 * Math.sin(a);
                const y1 = 150 - 128 * Math.cos(a);
                const x2 = 150 + 136 * Math.sin(a);
                const y2 = 150 - 136 * Math.cos(a);
                return (
                  <line
                    key={i}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="currentColor"
                    strokeOpacity={i % 6 === 0 ? 0.4 : 0.14}
                    strokeWidth={i % 6 === 0 ? 1.6 : 1}
                    style={{ color: CHALK }}
                  />
                );
              })}
              <path
                d="M 68.4 200 A 95 95 0 1 1 231.6 200"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeWidth="8"
                strokeLinecap="round"
                style={{ color: CHALK }}
              />
              <motion.path
                d="M 68.4 200 A 95 95 0 1 1 231.6 200"
                fill="none"
                stroke="var(--vl-brass)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 0.74 } : { pathLength: 0 }}
                transition={{ duration: 1.7, ease: EASE }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-[5rem] leading-none tabular-nums" style={{ color: CHALK }}>
                {n}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--vl-brass)]">
                amber · getting there
              </p>
            </div>

            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/50">
              DBMS · readiness index
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* revision planner                                                    */
/* ------------------------------------------------------------------ */

function RevisionScene() {
  const steps = [
    ["Day 0", "A missed key point becomes a flashcard."],
    ["Day 1", "First review — active recall, not re-reading."],
    ["Day 6", "Second review, if the answer held."],
    ["× EF", "Intervals grow with your ease factor."],
  ] as const;

  const [flipped, setFlipped] = useState(false);

  return (
    <section id="revision" className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <Reveal>
            <Eyebrow>Revision planner</Eyebrow>
            <h2
              className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
              style={{ color: CHALK }}
            >
              Practice that <em className="text-[var(--vl-brass)]">sticks</em> — scheduled
              by spaced repetition.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
              After each session, missed key points return as flashcards on the
              SM-2 schedule. A daily revision list keeps what you fixed — a
              learning-science method, not a highlight reel.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-10">
            <div className="relative">
              <div className="absolute left-0 top-[5px] hidden h-px w-3/4 bg-[var(--vl-chalk)]/12 sm:block" aria-hidden="true" />
              <div className="relative grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {steps.map(([d, t]) => (
                  <div key={d}>
                    <span className="block h-[11px] w-[11px] rounded-full border-2 border-[var(--vl-brass)] bg-[var(--vl-bg)]" />
                    <p className="mt-4 font-display text-lg" style={{ color: CHALK }}>
                      {d}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--vl-chalk)]/50">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/45">
              interval 1 day → 6 days → previous × ease factor · minimum 1.3
            </p>
          </Reveal>
        </div>

        {/* the flashcard — flip it */}
        <Reveal delay={0.1} className="flex justify-center">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Show the question" : "Show the model answer"}
            className="w-full max-w-md text-left"
            style={{ perspective: 1200 }}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="relative h-72 w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 flex flex-col justify-between rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/90 p-7 shadow-[0_36px_80px_-36px_var(--vl-shadow)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-chalk)]/40">
                  flashcard · transactions · due today
                </p>
                <p className="font-display text-2xl leading-snug" style={{ color: CHALK }}>
                  What does the write-ahead log guarantee before a commit?
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-brass)]">
                  speak the answer, then flip the card
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col justify-between rounded-xl border border-[var(--vl-brass)]/40 bg-[var(--vl-panel-2)] p-7 shadow-[0_36px_80px_-36px_var(--vl-shadow)]"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-brass)]">
                  model answer
                </p>
                <p className="text-[15px] leading-relaxed text-[var(--vl-chalk)]/80">
                  Changes are flushed to the log on disk <em>before</em> the data
                  pages are written — so a crash mid-commit can be replayed to a
                  consistent state.
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/40">
                  again · hard · good · easy → next interval
                </p>
              </div>
            </motion.div>
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* examiner personas                                                   */
/* ------------------------------------------------------------------ */

const PERSONAS = [
  {
    name: "The Friendly Mentor",
    tone: "Warm, encouraging, patient",
    timer: "Relaxed",
    followups: "2 per question",
    strict: 1,
    quote: "Take your time — walk me through it.",
    fit: "first practice and the weekly habit",
    accent: "var(--vl-green)",
  },
  {
    name: "The Strict External",
    tone: "Formal, exacting, precise",
    timer: "Strict",
    followups: "2 per question",
    strict: 3,
    quote: "That is not what I asked. Define it properly.",
    fit: "final-week polish and external panels",
    accent: "var(--vl-red)",
  },
  {
    name: "Rapid-Fire HR",
    tone: "Fast, conversational, relentless",
    timer: "30 seconds",
    followups: "1 — speed over depth",
    strict: 2,
    quote: "Sell me this project in one sentence. Go.",
    fit: "placement drives and HR screens",
    accent: "var(--vl-steel)",
  },
];

function PersonaCard({
  per,
  i,
  veil,
}: {
  per: (typeof PERSONAS)[number];
  i: number;
  veil?: MotionValue<number>;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/92 p-7 shadow-[0_50px_100px_-44px_var(--vl-shadow)] sm:p-8">
      {/* the persona's accent, exposed on the deck's peeking edge */}
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: per.accent, opacity: 0.85 }}
        aria-hidden="true"
      />
      {/* the veil — a covered card eases back toward the page, both themes */}
      {veil && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-xl"
          style={{ background: "var(--vl-bg)", opacity: veil }}
        />
      )}
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: per.accent }}>
          persona 0{i + 1}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/35">
          {per.timer} timer
        </p>
      </div>
      <h3 className="mt-4 font-display text-2xl leading-tight sm:text-[1.7rem]" style={{ color: CHALK }}>
        {per.name}
      </h3>
      <p className="mt-4 font-display text-lg italic leading-snug text-[var(--vl-chalk)]/70">
        &ldquo;{per.quote}&rdquo;
      </p>

      <dl className="mt-6 space-y-2.5 border-t border-[var(--vl-chalk)]/10 pt-5 text-[13px]">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--vl-chalk)]/45">Tone</dt>
          <dd className="text-right text-[var(--vl-chalk)]/80">{per.tone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--vl-chalk)]/45">Follow-ups</dt>
          <dd className="text-right text-[var(--vl-chalk)]/80">{per.followups}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--vl-chalk)]/45">Strictness</dt>
          <dd className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className="h-1.5 w-5 rounded-full"
                style={{
                  background:
                    s <= per.strict
                      ? per.accent
                      : "color-mix(in srgb, var(--vl-chalk) 14%, transparent)",
                }}
              />
            ))}
          </dd>
        </div>
      </dl>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-chalk)]/40">
        best for — {per.fit}
      </p>
    </div>
  );
}

/* reduced-motion telling — the same cards, simply stacked */
function PersonasStatic() {
  return (
    <section className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <Eyebrow>Examiner personas</Eyebrow>
          <h2
            className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
            style={{ color: CHALK }}
          >
            Choose who examines you.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
            Each persona has its own tone, timer, follow-up rules and scoring
            strictness — so you can rehearse for a warm supervisor, a hard
            external, or the panel that never stops talking.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PERSONAS.map((per, i) => (
            <PersonaCard key={per.name} per={per} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* the deck — each card rises, pins just below the last and stays;
   the card beneath eases back under a page-coloured veil as it is covered */
function PersonasDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: dp } = useScroll({
    target: deckRef,
    offset: ["start 0.8", "end 0.8"],
  });

  const s0 = useTransform(dp, [0.28, 0.56], [1, 0.94]);
  const s1 = useTransform(dp, [0.6, 0.88], [1, 0.94]);
  const v0 = useTransform(dp, [0.28, 0.56], [0, 0.62]);
  const v1 = useTransform(dp, [0.6, 0.88], [0, 0.62]);

  return (
    <section className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Examiner personas</Eyebrow>
          <h2
            className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
            style={{ color: CHALK }}
          >
            Choose who examines you.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
            Each persona has its own tone, timer, follow-up rules and scoring
            strictness — so you can rehearse for a warm supervisor, a hard
            external, or the panel that never stops talking.
          </p>
        </Reveal>

        <div ref={deckRef} className="relative mt-14">
          {PERSONAS.map((per, i) => (
            <div
              key={per.name}
              className="sticky mx-auto w-full max-w-2xl"
              style={{
                top: `calc(5.5rem + ${i * 1.4}rem)`,
                paddingBottom: i < PERSONAS.length - 1 ? "18vh" : "6vh",
              }}
            >
              <motion.div
                style={
                  i === 0
                    ? { scale: s0, transformOrigin: "center top" }
                    : i === 1
                      ? { scale: s1, transformOrigin: "center top" }
                      : undefined
                }
              >
                <PersonaCard per={per} i={i} veil={i === 0 ? v0 : i === 1 ? v1 : undefined} />
              </motion.div>
            </div>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[var(--vl-chalk)]/55">
            Going further: upload your resume or the official syllabus, and
            document-aware mode asks about{" "}
            <span className="text-[var(--vl-chalk)]/75">
              your own projects and your exact course outline
            </span>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PersonasScene() {
  const reduce = useReducedMotion();
  if (reduce) return <PersonasStatic />;
  return <PersonasDeck />;
}

/* ------------------------------------------------------------------ */
/* for faculty                                                         */
/* ------------------------------------------------------------------ */

function FacultyScene() {
  const bars = [
    ["Joins", 71],
    ["Normalisation", 62],
    ["Indexing", 55],
    ["Transactions", 48],
    ["Recovery", 39],
  ] as const;

  const rows = [
    [
      "Class analytics",
      "Average score per topic, most-missed key points, students at risk — see what the class finds difficult before exam week.",
    ],
    [
      "Verified question bank",
      "Teachers add questions with the exact key points the examiner must check. The engine prefers them — and they cost no generation.",
    ],
    [
      "AI-vs-teacher calibration",
      "Mark a sample of answers; the panel tracks correlation and bias against your marks, targeting r ≥ 0.7.",
    ],
    [
      "Answer integrity",
      "Paste events and typing-speed signals flag probable copy-paste — informational, never an accusation.",
    ],
  ] as const;

  return (
    <section id="faculty" className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>For faculty &amp; institutions</Eyebrow>
          <h2
            className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
            style={{ color: CHALK }}
          >
            Before the real viva, see the whole class.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
            VivaMentor gives staff the same clarity it gives students — class-wide
            analytics, a verified question bank, and calibration that keeps AI
            scoring honest against your own marking.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            {rows.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.07}>
                <div className="flex gap-6 border-t border-[var(--vl-chalk)]/10 py-6">
                  <p className="pt-0.5 font-mono text-[11px] tabular-nums text-[var(--vl-brass)]/80">
                    0{i + 1}
                  </p>
                  <div>
                    <h3 className="font-display text-lg" style={{ color: CHALK }}>
                      {t}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--vl-chalk)]/55">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/85 p-7 shadow-[0_36px_80px_-40px_var(--vl-shadow)]">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--vl-chalk)]/45">
                  class analytics · DBMS · 24 students
                </p>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-green)]">
                  <span className="vm-dot h-1.5 w-1.5 rounded-full bg-current" />
                  live
                </p>
              </div>

              <div className="mt-7 space-y-4">
                {bars.map(([label, v]) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between">
                      <p className="text-[13px] text-[var(--vl-chalk)]/75">{label}</p>
                      <p className="font-mono text-[11px] tabular-nums text-[var(--vl-chalk)]/50">
                        {(v / 10).toFixed(1)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-[3px] w-full rounded-full bg-[var(--vl-chalk)]/8">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${v}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: EASE }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            v < 50 ? "var(--vl-red)" : v < 60 ? "var(--vl-brass)" : "var(--vl-green)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-end justify-between gap-4 border-t border-[var(--vl-chalk)]/10 pt-6">
                <div>
                  <p className="font-display text-4xl leading-none" style={{ color: CHALK }}>
                    r = 0.82
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--vl-chalk)]/45">
                    AI-vs-teacher correlation · above target
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl leading-none text-[var(--vl-red)]">3</p>
                  <p className="mt-2 text-[11px] text-[var(--vl-chalk)]/45">students at risk</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* faq                                                                 */
/* ------------------------------------------------------------------ */

const FAQS: [string, string][] = [
  [
    "Is VivaMentor free to use?",
    "Yes. Creating an account, practicing and revising is free. Sign up as a student or teacher, or open a demo account to look around first.",
  ],
  [
    "Does it replace mock sessions with teachers?",
    "No — it prepares you for them. Teachers stay in control of the question bank and can calibrate AI scores against their own marking; VivaMentor simply handles the repetition that one-to-one hours cannot cover.",
  ],
  [
    "How is my voice handled?",
    "Speech recognition, when available, runs in your browser. Audio and transcripts stay on your device in this frontend demo.",
  ],
  [
    "How are answers scored?",
    "Each answer is evaluated against four criteria — correctness, completeness, clarity and depth — with the exact key points covered and missed shown alongside. The overall score is a weighted average, and teachers can configure the weights.",
  ],
  [
    "Which subjects can I practice?",
    "Any subject your department sets up. You can also upload a syllabus or your own document, and document-aware mode will examine you on your exact course material.",
  ],
  [
    "Does it work on my browser?",
    "Voice input works best in Chrome and Edge, which support in-browser speech recognition. Typed input is always available, whatever browser you use.",
  ],
];

function FaqScene() {
  return (
    <section id="faq" className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2
              className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
              style={{ color: CHALK }}
            >
              Questions, answered.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
              Anything else — ask inside the app, or write to the team from your
              dashboard.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map(([q, a], i) => (
              <AccordionItem
                key={q}
                value={`q-${i}`}
                className="rounded-lg border border-[var(--vl-chalk)]/10 bg-[var(--vl-panel)]/60 px-5 transition-colors data-[state=open]:border-[var(--vl-chalk)]/22 hover:border-[var(--vl-chalk)]/22 [&:not(:last-child)]:mb-3"
              >
                <AccordionTrigger className="py-5 text-[15px] font-medium no-underline hover:no-underline [&>svg]:text-[var(--vl-chalk)]/50">
                  <span style={{ color: CHALK }}>{q}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-[var(--vl-chalk)]/55">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* get started — three doors, one gate                                  */
/* ------------------------------------------------------------------ */

const SEATS: { role: "student" | "teacher" | "admin"; title: string; line: string; detail: string }[] = [
  {
    role: "student",
    title: "Student",
    line: "The classroom",
    detail: "Rehearse out loud, keep a streak, let the revision planner chase the gaps for you.",
  },
  {
    role: "teacher",
    title: "Faculty",
    line: "The staff room",
    detail: "Publish question banks, watch class analytics, calibrate marks against the rubric.",
  },
  {
    role: "admin",
    title: "Administration",
    line: "The control room",
    detail: "Platform health, seats, AI usage limits — the whole instrument panel in one view.",
  },
];

function GetStartedScene({ authedRole }: { authedRole: string | null }) {
  return (
    <section id="get-started" className="border-t border-[var(--vl-chalk)]/8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Get started</Eyebrow>
          <h2
            className="mt-6 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] tracking-tight"
            style={{ color: CHALK }}
          >
            Take a seat — or look around first.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--vl-chalk)]/55">
            Three doors, one gate. Choose the seat you will practise from —
            each opens with one click on a live demo, fully populated.
          </p>
        </Reveal>

        {authedRole ? (
          <Reveal delay={0.1} className="mt-12">
            <Link
              href={roleHome(authedRole)}
              className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--vl-brass)]/45 bg-[var(--vl-panel)]/80 px-6 py-5 transition-colors hover:border-[var(--vl-brass)]"
            >
              <span>
                <span className="block font-display text-lg" style={{ color: CHALK }}>
                  You already have a seat here.
                </span>
                <span className="mt-1 block text-[13px] text-[var(--vl-chalk)]/55">
                  Your {authedRole.toLowerCase()} workspace is one click away.
                </span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--vl-brass)]">
                open workspace →
              </span>
            </Link>
          </Reveal>
        ) : (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {SEATS.map((seat, i) => (
              <Reveal key={seat.role} delay={0.08 * i}>
                <Link
                  href={`/login/${seat.role}`}
                  className="group flex h-full flex-col justify-between rounded-xl border border-[var(--vl-chalk)]/12 bg-[var(--vl-panel)]/70 p-6 transition-colors hover:border-[var(--vl-brass)]/55"
                >
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-brass)]/80">
                      {seat.line}
                    </p>
                    <p className="mt-3 font-display text-xl" style={{ color: CHALK }}>
                      {seat.title}
                    </p>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--vl-chalk)]/50">
                      {seat.detail}
                    </p>
                  </div>
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--vl-brass)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    enter →
                  </p>
                </Link>
              </Reveal>
            ))}

            <Reveal delay={0.26} className="md:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--vl-chalk)]/10 bg-[var(--vl-chalk)]/[0.03] px-6 py-5">
                <p className="text-[13.5px] text-[var(--vl-chalk)]/60">
                  New here? Creating an account takes a minute — free for students and faculty.
                </p>
                <Link
                  href="/register"
                  className="rounded-lg border border-[var(--vl-brass)]/50 px-5 py-2.5 text-[13px] font-semibold text-[var(--vl-brass)] transition-colors hover:bg-[var(--vl-brass)] hover:text-[var(--vl-bg)]"
                >
                  Create an account
                </Link>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--vl-chalk)]/8">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="font-display text-lg tracking-tight" style={{ color: CHALK }}>
                VivaMentor
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[var(--vl-chalk)]/50">
              AI viva and interview practice — prepare for the room, not just
              the paper.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-chalk)]/50">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[var(--vl-chalk)]/60">
              {[
                ["Why VivaMentor", "#why"],
                ["How it works", "#how-it-works"],
                ["Inside a session", "#product"],
                ["Readiness index", "#readiness"],
                ["Revision planner", "#revision"],
                ["FAQ", "#faq"],
              ].map(([l, h]) => (
                <li key={h}>
                  <a href={h} className="transition-colors hover:text-[var(--vl-chalk)]">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--vl-chalk)]/50">
              Try
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[var(--vl-chalk)]/60">
              <li>
                <Link href="/login/student" className="transition-colors hover:text-[var(--vl-chalk)]">
                  Student demo
                </Link>
              </li>
              <li>
                <Link href="/login/teacher" className="transition-colors hover:text-[var(--vl-chalk)]">
                  Faculty demo
                </Link>
              </li>
              <li>
                <Link href="/login/admin" className="transition-colors hover:text-[var(--vl-chalk)]">
                  Admin demo
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition-colors hover:text-[var(--vl-chalk)]">
                  Create an account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vl-chalk)]/8 pt-6 text-[11px] text-[var(--vl-chalk)]/55">
          <span>© 2026 VivaMentor</span>
          <span>AI feedback is guidance, not an official grade.</span>
          <span>Demo state stays in your browser; no live AI or backend service is connected.</span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* the page                                                            */
/* ------------------------------------------------------------------ */

const THEME_KEY = "vm-theme";

export default function Landing() {
  const [day, setDay] = useState(false);
  const [intro, setIntro] = useState(false); // hero waits for the preloader's hand-over
  const [booting, setBooting] = useState(true);
  const { me, booted: sessionBooted, refreshMe } = useApp();

  // a signed-in visitor still gets the full marketing page —
  // the header simply offers their workspace instead of the auth links
  useEffect(() => {
    if (!sessionBooted) void refreshMe();
  }, [sessionBooted, refreshMe]);
  const authedRole = me?.user.role ?? null;

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      /* private mode — stay on ink */
    }
    if (stored !== "day") return;
    // one frame later — storage is an external system, the paint stays clean
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

  const handleReveal = useCallback(() => setIntro(true), []);
  const handleDone = useCallback(() => setBooting(false), []);

  return (
    <div
      className="vl-stage relative min-h-screen overflow-x-clip"
      data-mode={day ? "day" : "ink"}
      style={{ background: INK, color: CHALK }}
    >
      {/* backdrop — quiet light on ink (or paper), nothing louder */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "var(--vl-aura)" }} />
        <div className="absolute inset-0" style={{ background: "var(--vl-sweep)" }} />
      </div>

      <Nav intro={intro} day={day} onToggle={toggleTheme} authedRole={authedRole} />

      <main className="relative z-10">
        <Hero intro={intro} authedRole={authedRole} />
        <StatsBand />
        <WhyScene />
        <HowScene />
        <SessionScene />
        <DeliveryScene />
        <ReadinessScene />
        <RevisionScene />
        <PersonasScene />
        <FacultyScene />
        <FaqScene />
        <GetStartedScene authedRole={authedRole} />
      </main>

      <Footer />

      {booting && <Preloader onReveal={handleReveal} onDone={handleDone} />}
    </div>
  );
}
