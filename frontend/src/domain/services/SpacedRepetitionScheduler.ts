import type { ReviewGrade } from "@/src/features/learning/model/types";

/**
 * SpacedRepetitionScheduler
 * Domain service encapsulating spaced repetition calculations and intervals.
 */
export class SpacedRepetitionScheduler {
  private static readonly INTERVALS = [3, 7, 14, 30] as const;

  /**
   * Calculates the next review interval in days based on memory level and grade.
   */
  public static calculateNextInterval(currentMemoryLevel: number, grade: ReviewGrade): number {
    switch (grade) {
      case "forgot":
        return 1;
      case "got_it":
        if (currentMemoryLevel < 5 && currentMemoryLevel >= 1) {
          return this.INTERVALS[currentMemoryLevel - 1] ?? 30;
        }
        return 30;
      case "too_easy":
        return 30;
      default:
        return 1;
    }
  }

  /**
   * Returns a human-readable interval description for review prompts.
   */
  public static getIntervalDescription(currentMemoryLevel: number, grade: ReviewGrade): string {
    switch (grade) {
      case "forgot":
        return "Again tomorrow";
      case "got_it": {
        const days = this.calculateNextInterval(currentMemoryLevel, grade);
        return `Next in ${days} days`;
      }
      case "too_easy":
        return "Next in 30 days";
      default:
        return "";
    }
  }
}
