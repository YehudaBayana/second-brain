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

export type ReviewGrade = "forgot" | "got_it" | "too_easy";
