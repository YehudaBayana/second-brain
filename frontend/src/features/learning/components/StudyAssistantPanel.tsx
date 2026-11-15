"use client";

import {
  Anchor,
  Button,
  Drawer,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { useStudyNoteForm } from "../hooks/useStudyNoteForm";
import type { Note } from "../model/types";
import { CreatedNotePanel } from "./CreatedNotePanel";
import { Icon } from "./Icon";
import { NoteChat } from "./NoteChat";
import { StudyNoteForm } from "./StudyNoteForm";

export function StudyAssistantPanel({
  id,
  opened,
  onClose,
}: {
  id: string;
  opened: boolean;
  onClose: () => void;
}) {
  const { createdNote, dismissCreatedNote } = useStudyNoteForm();
  const [noteOverride, setNoteOverride] = useState<{
    id: string;
    note: Note;
  } | null>(null);
  const currentNote =
    createdNote && noteOverride?.id === createdNote.note.id
      ? noteOverride.note
      : (createdNote?.note ?? null);

  return (
    <Drawer
      id={id}
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={createdNote ? "Continue learning" : "Save something new"}
    >
      {createdNote ? (
        <Group justify="flex-end" mb="md">
          <Button
            variant="default"
            size="xs"
            onClick={dismissCreatedNote}
            leftSection={<Icon name="plus" size={14} />}
          >
            New note
          </Button>
        </Group>
      ) : null}

      <Stack gap="md">
        {createdNote && currentNote ? (
          <>
            <CreatedNotePanel
              createdNote={{ ...createdNote, note: currentNote }}
            />
            <Anchor
              component={Link}
              href={`/notes/${encodeURIComponent(currentNote.id)}`}
            >
              Open full note
              <Icon name="arrow" size={14} />
            </Anchor>
            <Stack gap="sm">
              <Text>
                Ask a follow-up about “{currentNote.title}”
              </Text>
              <NoteChat
                key={currentNote.id}
                note={currentNote}
                onNoteUpdate={(note) =>
                  setNoteOverride({ id: currentNote.id, note })
                }
              />
            </Stack>
          </>
        ) : (
          <>
            <Text>
              Ask about anything you’re learning. I’ll create a study note you
              can keep refining with follow-up questions.
            </Text>
            <StudyNoteForm />
          </>
        )}
      </Stack>
    </Drawer>
  );
}
