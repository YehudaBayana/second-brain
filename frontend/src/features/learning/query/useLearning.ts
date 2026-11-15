import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createNote,
  getDueCards,
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
