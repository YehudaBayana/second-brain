import { defaultHttpClient, type HttpClient } from "@/src/services/apiClient";
import type { Note } from "@/src/features/notes/model/types";

export class SearchService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  searchNotes(query: string): Promise<Note[]> {
    return this.http.get<Note[]>("/api/search", { params: { q: query } });
  }
}

export const searchService = new SearchService();
