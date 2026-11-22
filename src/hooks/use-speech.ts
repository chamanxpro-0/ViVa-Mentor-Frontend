// useSpeechRecognition — Web Speech API capture for E2 (Voice Delivery Analytics).
// Tracks the live transcript, word timing for pace (WPM), long pauses (>2s
// gaps between phrases) and lets the caller compute fillers from the final
// transcript. Transcript stays editable before submission (spec §11).

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FILLER_WORDS, DELIVERY_TARGETS, type DeliveryMetrics } from "@/lib/types";

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const lastPhraseAtRef = useRef<number | null>(null);
  const wordCountRef = useRef(0);

  const speechSupported = useSyncExternalStore(
    subscribeNoop,
    () => Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
    () => false
  );

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // per-second ticker for the live pace indicator
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      const start = startedAtRef.current;
      if (start == null) return;
      const sec = Math.max(1, (Date.now() - start) / 1000);
      setElapsedSec(Math.round(sec));
      setLiveWpm(Math.round(wordCountRef.current / (sec / 60)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  const ensureRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += text;
        } else {
          setInterim(text);
        }
      }
      if (finalChunk.trim()) {
        const now = Date.now();
        // long pause detection: gap between consecutive finalized phrases
        if (
          lastPhraseAtRef.current != null &&
          now - lastPhraseAtRef.current > DELIVERY_TARGETS.pauseSec * 1000
        ) {
          setPauses((p) => p + 1);
        }
        lastPhraseAtRef.current = now;
        wordCountRef.current += finalChunk.trim().split(/\s+/).length;
        setTranscript((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
        setInterim("");
      }
    };

    rec.onerror = (event) => {
      const err = (event as Event & { error?: string }).error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setError("Microphone permission was denied. Allow mic access or type your answer.");
        wantListeningRef.current = false;
        setListening(false);
      } else if (err === "no-speech") {
        // benign — recognition restarts
      } else if (err) {
        setError(`Speech recognition error: ${err}`);
      }
    };

    rec.onend = () => {
      // Chrome stops after silence; restart while the student still wants to talk
      if (wantListeningRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    return rec;
  }, []);

  const start = useCallback(() => {
    setError(null);
    const rec = ensureRecognition();
    if (!rec) return;
    wantListeningRef.current = true;
    startedAtRef.current = Date.now();
    lastPhraseAtRef.current = null;
    try {
      rec.start();
      setListening(true);
    } catch {
      /* already started */
    }
  }, [ensureRecognition]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setInterim("");
    setElapsedSec(0);
    setLiveWpm(0);
    setPauses(0);
    wordCountRef.current = 0;
    startedAtRef.current = null;
    lastPhraseAtRef.current = null;
  }, [stop]);

  /** Compute the E2 delivery report from what was captured. */
  const computeDelivery = useCallback((): DeliveryMetrics | null => {
    const start = startedAtRef.current;
    if (!start) return null;
    const words = transcript.trim() ? transcript.trim().split(/\s+/) : [];
    if (words.length === 0) return null;
    const durationSec = Math.max(1, (Date.now() - start) / 1000);
    const lower = ` ${transcript.toLowerCase()} `;
    let fillers = 0;
    for (const filler of FILLER_WORDS) {
      const matches = lower.match(new RegExp(`\\s${filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s`, "g"));
      fillers += matches ? matches.length : 0;
    }
    return {
      wpm: Math.round(words.length / (durationSec / 60)),
      fillers,
      fillerPerMin: Math.round((fillers / (durationSec / 60)) * 10) / 10,
      pauses,
      wordCount: words.length,
      durationSec: Math.round(durationSec),
    };
  }, [transcript, pauses]);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return {
    supported: speechSupported,
    listening,
    transcript,
    setTranscript,
    interim,
    elapsedSec,
    liveWpm,
    pauses,
    error,
    start,
    stop,
    reset,
    computeDelivery,
  };
}

const subscribeNoop = () => () => {};
