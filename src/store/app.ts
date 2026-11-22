// Global client state (auth + view routing). The app is a single / route, so
// views are switched through this store.

"use client";

import { create } from "zustand";
import { api, clearDemoSession } from "@/lib/client";
import type { PublicUser } from "@/lib/types";

export type View =
  | "dashboard"
  | "setup"
  | "interview"
  | "report"
  | "progress"
  | "revision"
  | "documents"
  | "teacher"
  | "admin";

export interface MeState {
  user: PublicUser;
  dueCards: number;
  aiUsed: number;
}

interface AppStore {
  me: MeState | null;
  booted: boolean;
  view: View;
  activeSessionId: string | null;
  reportSessionId: string | null;
  revisionDone: number; // bump to refresh dashboards after reviews
  sessionEnded: number; // bump to refresh after finishing a session

  setMe: (me: MeState | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  setView: (view: View) => void;
  startInterview: (sessionId: string) => void;
  openReport: (sessionId: string) => void;
  bumpRevision: () => void;
  bumpSessionEnd: () => void;
}

export const useApp = create<AppStore>((set, get) => ({
  me: null,
  booted: false,
  view: "dashboard",
  activeSessionId: null,
  reportSessionId: null,
  revisionDone: 0,
  sessionEnded: 0,

  setMe: (me) => set({ me, booted: true }),

  refreshMe: async () => {
    try {
      const data = await api<{ user: PublicUser; dueCards: number; aiUsed: number }>(
        "/api/auth/me"
      );
      set({ me: { user: data.user, dueCards: data.dueCards, aiUsed: data.aiUsed }, booted: true });
    } catch {
      set({ me: null, booted: true });
    }
  },

  logout: async () => {
    await clearDemoSession();
    set({ me: null, booted: false, view: "dashboard", activeSessionId: null, reportSessionId: null });
  },

  setView: (view) => set({ view }),

  startInterview: (sessionId) => set({ activeSessionId: sessionId, view: "interview" }),

  openReport: (sessionId) => set({ reportSessionId: sessionId, view: "report" }),

  bumpRevision: () => {
    set({ revisionDone: get().revisionDone + 1 });
    void get().refreshMe();
  },

  bumpSessionEnd: () => {
    set({ sessionEnded: get().sessionEnded + 1 });
    void get().refreshMe();
  },
}));
