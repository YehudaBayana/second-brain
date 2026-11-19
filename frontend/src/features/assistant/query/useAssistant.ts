import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assistantService } from "../api/AssistantService";
import type { Note, NoteDetail } from "@/src/features/notes/model/types";
import type { NoteChatMessage } from "../model/types";
import { noteKeys, reviewKeys } from "@/src/services/keys";

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
    }) => assistantService.chatAboutNote(noteId, message, history),
    onSuccess: async (result) => {
      queryClient.setQueryData<NoteDetail>(
        noteKeys.detail(result.note.id),
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
      queryClient.setQueryData<Note[]>(noteKeys.list(), (notes) =>
        notes?.map((note) => (note.id === result.note.id ? result.note : note)),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: noteKeys.list() }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.dueCards() }),
      ]);
    },
  });
}
