"use client";

import type { FormEvent } from "react";
import { useSearchNotes } from "../query/useLearning";
import { useSearchStore } from "../store/useSearchStore";

/**
 * useNoteSearch
 * Custom hook encapsulating search query state, execution,
 * loading state, and search error management.
 */
export function useNoteSearch() {
  const searchMutation = useSearchNotes();
  const {
    searchTerm,
    hasSearched,
    searchResults,
    searchError,
    setSearchTerm,
    setSearchResults,
    setSearchError,
    resetSearch,
  } = useSearchStore();

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    setSearchError(null);
    try {
      const results = await searchMutation.mutateAsync(query);
      setSearchResults(results);
    } catch (cause) {
      setSearchError(
        cause instanceof Error ? cause.message : "Search is unavailable.",
      );
    }
  };

  return {
    searchTerm,
    hasSearched,
    searchResults,
    searchError,
    isSearching: searchMutation.isPending,
    setSearchTerm,
    handleSearch,
    resetSearch,
    clearError: () => setSearchError(null),
  };
}
