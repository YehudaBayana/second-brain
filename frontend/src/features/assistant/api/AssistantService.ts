import { defaultHttpClient, type HttpClient } from "@/src/services/apiClient";
import type { NoteChatMessage, NoteChatResponse } from "../model/types";

export class AssistantService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  chatAboutNote(
    noteId: string,
    message: string,
    history: NoteChatMessage[],
  ): Promise<NoteChatResponse> {
    return this.http.post<NoteChatResponse>(
      `/api/notes/${encodeURIComponent(noteId)}/chat`,
      { message, history },
    );
  }
}

export const assistantService = new AssistantService();
