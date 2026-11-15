"use client";

import { Anchor, Box, Button, Group, Paper, Text, Title } from "@mantine/core";
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
    <Paper
      id={id}
      className={`study-assistant-panel ${opened ? "opened" : ""}`}
      aria-hidden={!opened}
      inert={!opened}
    >
      <Box className="study-assistant-heading">
        <Box>
          <Text className="eyebrow">YOUR STUDY ASSISTANT</Text>
          <Title order={2}>
            {createdNote ? "Continue learning" : "Save something new"}
          </Title>
        </Box>
        <Group gap={5}>
          {createdNote ? (
            <Button
              variant="subtle"
              size="xs"
              onClick={dismissCreatedNote}
              leftSection={<Icon name="plus" size={14} />}
            >
              New note
            </Button>
          ) : null}
          <Button
            variant="subtle"
            className="icon-button assistant-close"
            aria-label="Close study assistant"
            onClick={onClose}
          >
            <Icon name="close" />
          </Button>
        </Group>
      </Box>

      <Box className="study-assistant-body">
        {createdNote && currentNote ? (
          <>
            <CreatedNotePanel
              createdNote={{ ...createdNote, note: currentNote }}
            />
            <Anchor
              component={Link}
              href={`/notes/${encodeURIComponent(currentNote.id)}`}
              className="assistant-note-link"
            >
              Open full note
              <Icon name="arrow" size={14} />
            </Anchor>
            <Box className="assistant-chat-section">
              <Text className="assistant-chat-heading">
                Ask a follow-up about “{currentNote.title}”
              </Text>
              <NoteChat
                key={currentNote.id}
                note={currentNote}
                onNoteUpdate={(note) =>
                  setNoteOverride({ id: currentNote.id, note })
                }
              />
            </Box>
          </>
        ) : (
          <Box className="assistant-create-section">
            <Text className="assistant-intro">
              Ask about anything you’re learning. I’ll create a study note you
              can keep refining with follow-up questions.
            </Text>
            <StudyNoteForm />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
