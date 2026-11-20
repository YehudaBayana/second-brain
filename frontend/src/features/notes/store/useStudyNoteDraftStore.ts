import { create } from "zustand";
import type { CreatedNote } from "../model/types";

export interface StudyNoteDraftState {
  topicId: string;
  question: string;
  saveToDeck: boolean;
  createdNote: CreatedNote | null;
  formError: string | null;

  setTopicId: (topicId: string) => void;
  setQuestion: (question: string) => void;
  setSaveToDeck: (saveToDeck: boolean) => void;
  setCreatedNote: (createdNote: CreatedNote | null) => void;
  setFormError: (error: string | null) => void;
  resetForm: () => void;
}

const initialState = {
  topicId: "",
  question: "",
  saveToDeck: true,
  createdNote: null,
  formError: null,
};

export const useStudyNoteDraftStore = create<StudyNoteDraftState>((set) => ({
  ...initialState,
  setTopicId: (topicId) => set({ topicId }),
  setQuestion: (question) => set({ question }),
  setSaveToDeck: (saveToDeck) => set({ saveToDeck }),
  setCreatedNote: (createdNote) => set({ createdNote }),
  setFormError: (formError) => set({ formError }),
  resetForm: () =>
    set({
      question: "",
      saveToDeck: true,
      formError: null,
    }),
}));
