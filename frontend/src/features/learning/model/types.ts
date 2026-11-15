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

export type Flashcard = {
  id: string;
  noteId: string;
  topicName: string;
  noteTitle: string;
  frontQuestion: string;
  backAnswer: string;
  memoryLevel: number;
  nextReviewDate: string;
};

export type LearningStats = {
  notes: number;
  cards: number;
  dueToday: number;
  topics: number;
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
  cards: Flashcard[];
  relatedNotes: RelatedNote[];
};

export type CreateNoteInput = {
  topic_id: string;
  question: string;
  source_text: string;
  source_url: string;
  save_to_deck: boolean;
};

export type NoteChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type NoteChatResponse = {
  answer: string;
  note: Note;
  updated: boolean;
};

export type NoteDetail = {
  note: Note;
  cards: Flashcard[];
};

export type ReviewGrade = "forgot" | "got_it" | "too_easy";

export type Section = "overview" | "library" | "review" | "search";
