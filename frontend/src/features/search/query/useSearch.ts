import { useMutation } from "@tanstack/react-query";
import { searchService } from "../api/SearchService";
import { NoteEntity } from "@/src/features/notes/model/NoteEntity";

export function useSearchNotes() {
  return useMutation({
    mutationFn: async (query: string) =>
      NoteEntity.fromRawList(await searchService.searchNotes(query)),
  });
}
