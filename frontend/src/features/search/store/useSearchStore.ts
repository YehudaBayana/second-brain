import { create } from "zustand";
import type { NoteEntity } from "@/src/features/notes/model/NoteEntity";

export interface SearchState {
  searchTerm: string;
  hasSearched: boolean;
  searchResults: NoteEntity[];
  searchError: string | null;

  setSearchTerm: (term: string) => void;
  setSearchResults: (results: NoteEntity[]) => void;
  setSearchError: (error: string | null) => void;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchTerm: "",
  hasSearched: false,
  searchResults: [],
  searchError: null,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSearchResults: (searchResults) =>
    set({ searchResults, hasSearched: true, searchError: null }),
  setSearchError: (searchError) => set({ searchError }),
  resetSearch: () =>
    set({
      searchTerm: "",
      hasSearched: false,
      searchResults: [],
      searchError: null,
    }),
}));
