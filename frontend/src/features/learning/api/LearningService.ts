import {
  defaultHttpClient,
  HttpClient,
} from "@/src/services/apiClient";
import type {
  CreateNoteInput,
  CreatedNote,
  Flashcard,
  LearningStats,
  Note,
  ReviewGrade,
  Topic,
} from "../model/types";
import type { RequestOptions } from "@/src/services/apiClient";

/**
 * LearningApiService
 * OOP Service encapsulating all communication with the learning endpoints.
 * Returns transport DTOs; query selectors convert them into domain entities.
 */
export class LearningApiService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  public getTopics(options?: RequestOptions): Promise<Topic[]> {
    return this.http.get<Topic[]>("/api/topics", options);
  }

  public getNotes(options?: RequestOptions): Promise<Note[]> {
    return this.http.get<Note[]>("/api/notes", options);
  }

  public getDueCards(options?: RequestOptions): Promise<Flashcard[]> {
    return this.http.get<Flashcard[]>("/api/review/due", options);
  }

  public getLearningStats(options?: RequestOptions): Promise<LearningStats> {
    return this.http.get<LearningStats>("/api/stats", options);
  }

  public searchNotes(query: string): Promise<Note[]> {
    return this.http.get<Note[]>("/api/search", { params: { q: query } });
  }

  public createNote(input: CreateNoteInput): Promise<CreatedNote> {
    return this.http.post<CreatedNote>("/api/notes", input);
  }

  public gradeCard(cardId: string, grade: ReviewGrade): Promise<void> {
    return this.http.post<void>(`/api/review/${encodeURIComponent(cardId)}`, {
      grade,
    });
  }
}

export const learningApiService = new LearningApiService();
