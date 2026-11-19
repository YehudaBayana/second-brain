import { notesService } from "./NotesService";
import type { CreateNoteInput } from "../model/types";

export const getTopics = () => notesService.getTopics();
export const getNotes = () => notesService.getNotes();
export const getNote = (noteId: string) => notesService.getNote(noteId);
export const deleteNote = (noteId: string) => notesService.deleteNote(noteId);
export const createNote = (input: CreateNoteInput) =>
  notesService.createNote(input);

export { notesService };
