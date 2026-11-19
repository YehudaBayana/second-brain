import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNote,
  getNote,
  getNotes,
  getTopics,
  deleteNote,
} from "../api/notes";
import type { Note, NoteDetail } from "../model/types";
import { NoteEntity } from "../model/NoteEntity";
import {
  dashboardKeys,
  noteKeys,
  topicKeys,
  reviewKeys,
} from "@/src/services/keys";

export const noteQueries = {
  topics: () => ({
    queryKey: topicKeys.list(),
    queryFn: getTopics,
  }),
  notes: () => ({
    queryKey: noteKeys.list(),
    queryFn: getNotes,
  }),
};

export function useTopics() {
  return useQuery(noteQueries.topics());
}

export function useNotes() {
  return useQuery({
    ...noteQueries.notes(),
    select: (notes: Note[]) => NoteEntity.fromRawList(notes),
  });
}

export function useNote(noteId: string) {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => getNote(noteId),
    select: (detail: NoteDetail) => ({
      ...detail,
      note: NoteEntity.fromRaw(detail.note),
    }),
    enabled: Boolean(noteId),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: noteKeys.list() }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.dueCards() }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
      ]);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: async (res) => {
      console.log("delete not res: ", res);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: noteKeys.list() }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.dueCards() }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
      ]);
    },
  });
}
