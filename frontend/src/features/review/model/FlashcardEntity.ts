import type { Flashcard, ReviewGrade } from "./types";
import { SpacedRepetitionScheduler } from "./SpacedRepetitionScheduler";

/**
 * FlashcardEntity
 * Rich Domain Entity representing a Flashcard / Quiz item.
 * Encapsulates domain logic, review status, and interval scheduling.
 */
export class FlashcardEntity implements Flashcard {
  readonly id: string;
  readonly noteId: string;
  readonly topicName: string;
  readonly noteTitle: string;
  readonly frontQuestion: string;
  readonly backAnswer: string;
  readonly memoryLevel: number;
  readonly nextReviewDate: string;

  constructor(data: Flashcard) {
    this.id = data.id;
    this.noteId = data.noteId;
    this.topicName = data.topicName;
    this.noteTitle = data.noteTitle;
    this.frontQuestion = data.frontQuestion;
    this.backAnswer = data.backAnswer;
    this.memoryLevel = typeof data.memoryLevel === "number" ? data.memoryLevel : 1;
    this.nextReviewDate = data.nextReviewDate;
  }

  /**
   * Checks whether this flashcard is currently due for review.
   */
  get isDue(): boolean {
    if (!this.nextReviewDate) return true;
    return new Date(this.nextReviewDate).getTime() <= Date.now();
  }

  /**
   * Returns interval in days for a given review grade.
   */
  public getNextIntervalDays(grade: ReviewGrade): number {
    return SpacedRepetitionScheduler.calculateNextInterval(this.memoryLevel, grade);
  }

  /**
   * Returns human-readable label for the next review time.
   */
  public getIntervalDescription(grade: ReviewGrade): string {
    return SpacedRepetitionScheduler.getIntervalDescription(this.memoryLevel, grade);
  }

  public static fromRaw(data: Flashcard): FlashcardEntity {
    return new FlashcardEntity(data);
  }

  public static fromRawList(list: Flashcard[] = []): FlashcardEntity[] {
    return list.map((item) => FlashcardEntity.fromRaw(item));
  }
}
