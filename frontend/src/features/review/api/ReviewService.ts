import { defaultHttpClient, type HttpClient } from "@/src/services/apiClient";
import type { RequestOptions } from "@/src/services/apiClient";
import type { Flashcard, ReviewGrade } from "../model/types";

export class ReviewService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  getDueCards(options?: RequestOptions): Promise<Flashcard[]> {
    return this.http.get<Flashcard[]>("/api/review/due", options);
  }

  gradeCard(cardId: string, grade: ReviewGrade): Promise<void> {
    return this.http.post<void>(`/api/review/${encodeURIComponent(cardId)}`, {
      grade,
    });
  }
}

export const reviewService = new ReviewService();
