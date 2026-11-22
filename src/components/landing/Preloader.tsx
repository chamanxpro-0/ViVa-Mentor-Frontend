// Preloader — the first two seconds of the product.
// A quiet ink screen. The wordmark sits centre. One clean band of
// morning light travels from the top corner to the bottom corner and
// catches the name as it passes. When the light reaches the far corner,
// the dark lifts along the same diagonal — a single crisp edge — and
// the page is already there. No spinner, no progress bar: the sweep
// itself is the progress, and a small counter confirms it.

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";

const INK = "#0a0d14";
const LIFT_AT = 1500; // ms — the dark starts lifting
const DONE_AT = 2400; // ms — unmount

export default function Preloader({
  onReveal,
  onDone,
}: {
  onReveal?: () => void;
  onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [lift, setLift] = useState(false);
  const revealRef = useRef(onReveal);
  const doneRef = useRef(onDone);
  revealRef.current = onReveal;
  doneRef.current = onDone;

  useEffect(() => {
    const root = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevRoot = root.style.overflow;
    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";

    const timers: number[] = [];
    const anims: { stop: () => void }[] = [];
    let finished = false;

    const unlock = () => {
      document.body.style.overflow = prevBody;
      root.style.overflow = prevRoot;
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      unlock();
      doneRef.current();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setPct(100);
      setLift(true);
      timers.push(window.setTimeout(finish, 400));
      return () => {
        timers.forEach((t) => window.clearTimeout(t));
        if (!finished) unlock();
      };
    }

    anims.push(
      animate(0, 100, {
        duration: 1.4,
        ease: [0.65, 0, 0.35, 1],
        onUpdate: (v) => setPct(Math.round(v)),
      })
    );

    timers.push(
      window.setTimeout(() => {
        setLift(true);
        revealRef.current?.();
      }, LIFT_AT)
    );
    timers.push(window.setTimeout(finish, DONE_AT));

    return () => {
      anims.forEach((a) => a.stop());
      timers.forEach((t) => window.clearTimeout(t));
      if (!finished) unlock();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden"
      style={{ background: INK }}
      role="status"
      aria-label="Loading VivaMentor"
    >
      {/* the morning waiting behind the dark — revealed first at the
          top corner as the sheet lifts */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 6% -8%, rgba(201,164,92,0.14), transparent 58%)",
        }}
        aria-hidden="true"
      />

      {/* the dark itself: a wide rotated sheet that lifts along the
          light's diagonal, top corner → bottom corner */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: "320vmax",
          height: "320vmax",
          marginLeft: "-160vmax",
          marginTop: "-160vmax",
          transform: "rotate(45deg)",
        }}
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: INK, willChange: "transform" }}
          initial={{ x: "0vmax" }}
          animate={{ x: lift ? "235vmax" : "0vmax" }}
          transition={{ duration: 0.85, ease: [0.7, 0, 0.3, 1] }}
        >
          {/* one crisp leading edge, then a short soft tail */}
          <div
            className="absolute inset-y-0 left-0 w-[26vmax]"
            style={{
              background:
                "linear-gradient(to right, rgba(255,232,186,0.10), transparent)",
            }}
          />
          <div
            className="absolute inset-y-0 left-0 w-[2.5vmax]"
            style={{
              background:
                "linear-gradient(to right, rgba(255,244,216,0.95), rgba(255,226,170,0.3) 55%, transparent)",
              filter: "blur(2px)",
            }}
          />
        </motion.div>
      </div>

      {/* the light — a single soft band travelling the diagonal */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 34%, rgba(255,228,175,0.07) 46%, rgba(255,240,212,0.14) 50%, rgba(255,228,175,0.07) 54%, transparent 66%)",
          backgroundSize: "300% 300%",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "screen",
        }}
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ backgroundPosition: "100% 100%" }}
        transition={{ duration: 1.55, ease: [0.5, 0.05, 0.3, 0.95] }}
        aria-hidden="true"
      />

      {/* the wordmark — dim base, caught by the light as it passes */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={lift ? { opacity: 0 } : { opacity: 1 }}
        transition={lift ? { duration: 0.35 } : { duration: 0.4 }}
      >
        <motion.p
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#f2eee3]/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          AI viva &amp; interview practice
        </motion.p>

        <div className="relative mt-4 overflow-hidden">
          <h1
            className="font-display text-[clamp(2.6rem,8vw,4.8rem)] leading-none tracking-tight text-[#f2eee3]/[0.16]"
            aria-label="VivaMentor"
          >
            VivaMentor
          </h1>
          <motion.div
            className="absolute inset-0"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ delay: 0.3, duration: 1.15, ease: [0.6, 0.05, 0.2, 1] }}
            aria-hidden="true"
          >
            <h1
              className="whitespace-nowrap font-display text-[clamp(2.6rem,8vw,4.8rem)] leading-none tracking-tight"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, #f4ead2 0%, #f8eccf 45%, #e8cc8e 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              VivaMentor
            </h1>
          </motion.div>
        </div>
      </motion.div>

      {/* the only machinery: a quiet counter, bottom-right */}
      <motion.p
        className="absolute bottom-6 right-7 font-mono text-[11px] tabular-nums text-[#f2eee3]/40"
        animate={{ opacity: lift ? 0 : 1 }}
        transition={{ duration: 0.25 }}
      >
        {String(pct).padStart(3, "0")}%
      </motion.p>
    </div>
  );
}
