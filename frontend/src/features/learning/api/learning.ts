import { learningApiService } from "./LearningService";
import type {
  CreateNoteInput,
  NoteChatMessage,
  ReviewGrade,
} from "../model/types";

export const getTopics = () => learningApiService.getTopics();
export const getNotes = () => learningApiService.getNotes();
export const getNote = (noteId: string) => learningApiService.getNote(noteId);
export const chatAboutNote = (
  noteId: string,
  message: string,
  history: NoteChatMessage[],
) => learningApiService.chatAboutNote(noteId, message, history);
export const getDueCards = () => learningApiService.getDueCards();
export const getLearningStats = () => learningApiService.getLearningStats();
export const searchNotes = (query: string) => learningApiService.searchNotes(query);
export const createNote = (input: CreateNoteInput) => learningApiService.createNote(input);
export const gradeCard = (cardId: string, grade: ReviewGrade) =>
  learningApiService.gradeCard(cardId, grade);

export { learningApiService };
