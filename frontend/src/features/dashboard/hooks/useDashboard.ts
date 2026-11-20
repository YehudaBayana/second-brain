"use client";

import { useGetCurrentUser } from "@/src/features/auth/query/useAuth";
import { useGetNotes, useGetTopics } from "@/src/features/notes/query/useNotes";
import { useLearningStats } from "../query/useDashboard";

const emptyStats = {
  notes: 0,
  cards: 0,
  dueToday: 0,
  topics: 0,
};

/**
 * useDashboard
 * Encapsulates data fetching and presentation helpers for the overview dashboard.
 */
export function useDashboard() {
  const userQuery = useGetCurrentUser();
  const notesQuery = useGetNotes();
  const topicsQuery = useGetTopics();
  const statsQuery = useLearningStats();

  const user = userQuery.data?.user;
  const greetingName = user?.email ? user.email.split("@")[0] : "there";
  const notes = notesQuery.data ?? [];
  const topics = topicsQuery.data ?? [];
  const stats = statsQuery.data ?? emptyStats;

  const isLoading =
    userQuery.isPending ||
    notesQuery.isPending ||
    topicsQuery.isPending ||
    statsQuery.isPending;

  const error = [
    userQuery.error,
    notesQuery.error,
    topicsQuery.error,
    statsQuery.error,
  ].find((err) => err instanceof Error);

  return {
    user,
    greetingName,
    notes,
    topics,
    stats,
    isLoading,
    errorMessage: error?.message ?? null,
  };
}
