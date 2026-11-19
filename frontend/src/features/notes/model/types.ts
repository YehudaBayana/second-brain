export type Topic = {
  id: string;
  name: string;
};

export type Note = {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  question: string;
  sourceText: string;
  explanation: string;
  keyTakeaways: string[];
  codeExamples: string[];
  sourceUrl: string | null;
  createdAt: string;
};

export type RelatedNote = {
  id: string;
  title: string;
  topicName: string;
  similarity: number;
};

export type CreatedNote = {
  note: Note;
  title: string;
  cards: import("@/src/features/review/model/types").Flashcard[];
  relatedNotes: RelatedNote[];
};

export type CreateNoteInput = {
  topic_id: string;
  question: string;
  source_text: string;
  source_url: string;
  save_to_deck: boolean;
};

export type NoteDetail = {
  note: Note;
  cards: import("@/src/features/review/model/types").Flashcard[];
};

export type Section = "overview" | "library" | "review" | "search";
