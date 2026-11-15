import { create } from "zustand";

export interface ReviewSessionState {
  isRevealed: boolean;
  sessionError: string | null;

  reveal: () => void;
  conceal: () => void;
  setSessionError: (error: string | null) => void;
  resetSession: () => void;
}

export const useReviewSessionStore = create<ReviewSessionState>((set) => ({
  isRevealed: false,
  sessionError: null,

  reveal: () => set({ isRevealed: true }),
  conceal: () => set({ isRevealed: false }),
  setSessionError: (sessionError) => set({ sessionError }),
  resetSession: () => set({ isRevealed: false, sessionError: null }),
}));
