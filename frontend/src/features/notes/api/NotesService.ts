import { defaultHttpClient, HttpClient } from "@/src/services/apiClient";
import type {
  CreateNoteInput,
  CreatedNote,
  NoteDetail,
  Note,
  Topic,
} from "../model/types";
import type { RequestOptions } from "@/src/services/apiClient";

export class NotesService {
  constructor(private readonly http: HttpClient = defaultHttpClient) {}

  public getTopics(options?: RequestOptions): Promise<Topic[]> {
    return this.http.get<Topic[]>("/api/topics", options);
  }

  public getNotes(options?: RequestOptions): Promise<Note[]> {
    return this.http.get<Note[]>("/api/notes", options);
  }

  public getNote(noteId: string): Promise<NoteDetail> {
    return this.http.get<NoteDetail>(
      `/api/notes/${encodeURIComponent(noteId)}`,
    );
  }

  public deleteNote(noteId: string): Promise<NoteDetail> {
    return this.http.delete<NoteDetail>(
      `/api/notes/${encodeURIComponent(noteId)}`,
    );
  }

  public createNote(input: CreateNoteInput): Promise<CreatedNote> {
    return this.http.post<CreatedNote>("/api/notes", input);
  }
}

export const notesService = new NotesService();
