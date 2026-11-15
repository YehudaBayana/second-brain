import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createNote,
  chatAboutNote,
  getDueCards,
  getNote,
  getLearningStats,
  getNotes,
  getTopics,
  gradeCard,
  searchNotes,
} from "../api/learning";
import type {
  Flashcard,
  LearningStats,
  Note,
  NoteChatMessage,
  NoteDetail,
  ReviewGrade,
} from "../model/types";
import { FlashcardEntity } from "@/src/domain/entities/FlashcardEntity";
import { NoteEntity } from "@/src/domain/entities/NoteEntity";
import { learningKeys } from "@/src/services/keys";

export const learningQueries = {
  topics: () => ({
    queryKey: learningKeys.topics(),
    queryFn: getTopics,
  }),
  notes: () => ({
    queryKey: learningKeys.notes(),
    queryFn: getNotes,
  }),
  dueCards: () => ({
    queryKey: learningKeys.dueCards(),
    queryFn: getDueCards,
  }),
  stats: () => ({
    queryKey: learningKeys.stats(),
    queryFn: getLearningStats,
  }),
};

export function useTopics() {
  return useQuery(learningQueries.topics());
}

export function useNotes() {
  return useQuery({
    ...learningQueries.notes(),
    select: (notes: Note[]) => NoteEntity.fromRawList(notes),
  });
}

export function useNote(noteId: string) {
  return useQuery({
    queryKey: learningKeys.note(noteId),
    queryFn: () => getNote(noteId),
    select: (detail: NoteDetail) => ({
      ...detail,
      note: NoteEntity.fromRaw(detail.note),
    }),
    enabled: Boolean(noteId),
  });
}

export function useChatAboutNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      message,
      history,
    }: {
      noteId: string;
      message: string;
      history: NoteChatMessage[];
    }) => chatAboutNote(noteId, message, history),
    onSuccess: async (result) => {
      queryClient.setQueryData<NoteDetail>(
        learningKeys.note(result.note.id),
        (detail) =>
          detail && {
            ...detail,
            note: result.note,
            cards: detail.cards.map((card) => ({
              ...card,
              noteTitle: result.note.title,
            })),
          },
      );
      queryClient.setQueryData<Note[]>(learningKeys.notes(), (notes) =>
        notes?.map((note) => (note.id === result.note.id ? result.note : note)),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: learningKeys.notes() }),
        queryClient.invalidateQueries({ queryKey: learningKeys.dueCards() }),
      ]);
    },
  });
}

export function useDueCards() {
  return useQuery({
    ...learningQueries.dueCards(),
    select: (cards: Flashcard[]) => FlashcardEntity.fromRawList(cards),
  });
}

export function useLearningStats() {
  return useQuery(learningQueries.stats());
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: learningKeys.notes() }),
        queryClient.invalidateQueries({ queryKey: learningKeys.dueCards() }),
        queryClient.invalidateQueries({ queryKey: learningKeys.stats() }),
      ]);
    },
  });
}

export function useSearchNotes() {
  return useMutation({
    mutationFn: async (query: string) =>
      NoteEntity.fromRawList(await searchNotes(query)),
  });
}

export function useGradeCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: ReviewGrade }) =>
      gradeCard(cardId, grade),
    onSuccess: () => {
      queryClient.setQueryData<Flashcard[]>(
        learningKeys.dueCards(),
        (cards) => cards?.slice(1),
      );
      queryClient.setQueryData(
        learningKeys.stats(),
        (stats: LearningStats | undefined) =>
          stats
            ? { ...stats, dueToday: Math.max(0, stats.dueToday - 1) }
            : stats,
      );
    },
  });
}
