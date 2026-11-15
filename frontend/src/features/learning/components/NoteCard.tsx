import {
  Accordion,
  Anchor,
  Box,
  Code,
  List,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import type { Note } from "../model/types";
import { NoteEntity } from "@/src/domain/entities/NoteEntity";
import { Icon } from "./Icon";

export function NoteCard({ note: rawNote }: { note: Note | NoteEntity }) {
  const note =
    rawNote instanceof NoteEntity ? rawNote : NoteEntity.fromRaw(rawNote);

  return (
    <Paper className="note-card">
      <Box className="note-card-topline">
        <Text component="span" className="topic-pill">
          {note.topicName}
        </Text>
        <Text className="note-date">{note.formattedDate}</Text>
      </Box>

      <Title order={3}>{note.displayTitle}</Title>
      <Text className="note-question">{note.question}</Text>
      <Text className="note-excerpt">{note.explanation}</Text>

      <Box className="note-card-bottom">
        <Text>{note.takeawaysCount} key ideas</Text>
        {note.hasSourceUrl && note.sourceUrl ? (
          <Anchor href={note.sourceUrl} target="_blank" rel="noreferrer">
            Open source <Icon name="arrow" size={14} />
          </Anchor>
        ) : null}
      </Box>
    </Paper>
  );
}
