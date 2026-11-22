// Badge catalogue — shared between server (award logic) and client (display).
// Marks are typographic (rendered in the display serif), not emoji.

export const BADGE_META: Record<string, { label: string; description: string; emoji: string }> = {
  first_session: { label: "First Session", description: "Completed your first mock session", emoji: "✦" },
  five_sessions: { label: "Committed", description: "Completed 5 sessions", emoji: "✳" },
  ten_sessions: { label: "Exam Machine", description: "Completed 10 sessions", emoji: "✹" },
  streak_7: { label: "Week Streak", description: "Practiced 7 days in a row", emoji: "⁂" },
  high_score: { label: "Examiner's Nod", description: "Scored 8.5+ in a full session", emoji: "✧" },
  revision_25: { label: "Recall Builder", description: "Reviewed 25 flashcards", emoji: "↻" },
};
