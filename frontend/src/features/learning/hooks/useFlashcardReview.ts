"use client";

import { useDueCards, useGradeCard, useLearningStats } from "../query/useLearning";
import { useReviewSessionStore } from "../store/useReviewSessionStore";
import type { ReviewGrade } from "../model/types";

/**
 * useFlashcardReview
 * Custom hook encapsulating flashcard retrieval, card revelation state,
 * grading mutations, and error handling.
 */
export function useFlashcardReview() {
  const dueCardsQuery = useDueCards();
  const statsQuery = useLearningStats();
  const gradeMutation = useGradeCard();

  const { isRevealed, sessionError, reveal, conceal, setSessionError } =
    useReviewSessionStore();

  const cards = dueCardsQuery.data ?? [];
  const currentCard = cards[0] ?? null;
  const stats = statsQuery.data ?? {
    notes: 0,
    cards: 0,
    dueToday: 0,
    topics: 0,
  };

  const gradeCurrentCard = async (grade: ReviewGrade) => {
    if (!currentCard) return;
    setSessionError(null);

    try {
      await gradeMutation.mutateAsync({ cardId: currentCard.id, grade });
      conceal();
    } catch (cause) {
      setSessionError(
        cause instanceof Error
          ? cause.message
          : "Could not save your review.",
      );
    }
  };

  const handleReveal = () => {
    reveal();
  };

  return {
    currentCard,
    cards,
    remainingCount: cards.length,
    stats,
    isRevealed,
    sessionError,
    isLoading: dueCardsQuery.isPending || statsQuery.isPending,
    isGrading: gradeMutation.isPending,
    reveal: handleReveal,
    gradeCurrentCard,
    clearError: () => setSessionError(null),
    refetchCards: () =>
      Promise.all([dueCardsQuery.refetch(), statsQuery.refetch()]),
  };
}
