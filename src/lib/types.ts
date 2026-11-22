// VivaMentor — shared domain types (spec (§5.1, §6, E1–E8)

export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export type Mode = "viva" | "hr" | "technical";
export type PersonaId = "friendly" | "strict" | "rapid";
export type InputType = "text" | "voice";

export interface TopicWeight {
  name: string;
  weight: number; // fraction of 1, e.g. 0.20
}

export interface RubricWeights {
  correctness: number;
  completeness: number;
  clarity: number;
  depth: number;
}

export const DEFAULT_RUBRIC: RubricWeights = {
  correctness: 0.4,
  completeness: 0.25,
  clarity: 0.2,
  depth: 0.15,
};

/** Structured evaluation output — exact shape from spec §5.1 */
export interface Evaluation {
  criteria: {
    correctness: number;
    completeness: number;
    clarity: number;
    depth: number;
  };
  score: number;
  coveredKeyPoints: string[];
  missingKeyPoints: string[];
  feedback: string;
  modelAnswer: string;
  followUp: string;
}

/** Pending question stored on the session */
export interface QuestionPayload {
  questionText: string;
  topic: string;
  difficulty: number;
  keyPoints: string[];
  isFollowUp: boolean;
  followUpOf?: string;
  followUpCount: number;
  askedAt: string;
}

/** Delivery metrics captured in the browser (E2) */
export interface DeliveryMetrics {
  wpm: number;
  fillers: number;
  fillerPerMin: number;
  pauses: number;
  wordCount: number;
  durationSec: number;
}

/** Integrity signals for typed answers (E8) */
export interface IntegritySignals {
  pasted: boolean;
  pasteCount: number;
  cps: number; // characters per second typing speed
  firstKeystrokeSec: number; // time to first keystroke
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  goal?: string | null;
  streak: number;
  xp: number;
  dailyAiLimit: number;
  createdAt: string;
}

export const MODE_LABELS: Record<Mode, string> = {
  viva: "Subject Viva",
  hr: "HR Interview",
  technical: "Technical Interview",
};

export const PERSONA_LABELS: Record<PersonaId, string> = {
  friendly: "Friendly Mentor",
  strict: "Strict External Examiner",
  rapid: "Rapid-Fire HR",
};

export const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Moderate", "Hard", "Expert"];

// Delivery targets from spec E2
export const DELIVERY_TARGETS = {
  wpmMin: 110,
  wpmMax: 160,
  fillerPerMinMax: 5,
  pauseSec: 2, // gap longer than this counts as a long pause
};

// Configurable filler list from spec E2
export const FILLER_WORDS = [
  "like",
  "basically",
  "you know",
  "actually",
  "so",
  "i mean",
  "sort of",
  "kind of",
  "literally",
  "right",
];
