import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "../api/ReviewService";
import { FlashcardEntity } from "../model/FlashcardEntity";
import type { Flashcard, ReviewGrade } from "../model/types";
import type { LearningStats } from "@/src/features/dashboard/model/types";
import { dashboardKeys, noteKeys, reviewKeys } from "@/src/services/keys";

export function useGetDueCards() {
  return useQuery({
    queryKey: reviewKeys.dueCards(),
    queryFn: () => reviewService.getDueCards(),
    select: (cards: Flashcard[]) => FlashcardEntity.fromRawList(cards),
  });
}

export function useGradeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: ReviewGrade }) =>
      reviewService.gradeCard(cardId, grade),
    onSuccess: () => {
      queryClient.setQueryData<Flashcard[]>(reviewKeys.dueCards(), (cards) =>
        cards?.slice(1),
      );
      queryClient.setQueryData(
        dashboardKeys.stats(),
        (stats: LearningStats | undefined) =>
          stats
            ? { ...stats, dueToday: Math.max(0, stats.dueToday - 1) }
            : stats,
      );
      queryClient.invalidateQueries({ queryKey: noteKeys.list() });
    },
  });
}
