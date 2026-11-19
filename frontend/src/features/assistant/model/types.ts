import type { Note } from "@/src/features/notes/model/types";

export type NoteChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type NoteChatResponse = {
  answer: string;
  note: Note;
  updated: boolean;
};
