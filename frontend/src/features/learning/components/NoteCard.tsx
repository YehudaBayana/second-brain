import {
  Anchor,
  Box,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import type { Note } from "../model/types";
import { NoteEntity } from "@/src/domain/entities/NoteEntity";
import { Icon } from "./Icon";

export function NoteCard({ note: rawNote }: { note: Note | NoteEntity }) {
  const note =
    rawNote instanceof NoteEntity ? rawNote : NoteEntity.fromRaw(rawNote);

  return (
    <Paper >
      <Anchor
        component={Link}
        href={`/notes/${encodeURIComponent(note.id)}`}
        
        aria-label={`Open note: ${note.displayTitle}`}
      />
      <Box >
        <Text component="span" >
          {note.topicName}
        </Text>
        <Text >{note.formattedDate}</Text>
      </Box>

      <Title order={3}>{note.displayTitle}</Title>
      <Text >{note.question}</Text>
      <Text >{note.explanation}</Text>

      <Box >
        <Text>{note.takeawaysCount} key ideas</Text>
        {note.hasSourceUrl && note.sourceUrl ? (
          <Anchor
            href={note.sourceUrl}
            target="_blank"
            rel="noreferrer"
            
          >
            Open source <Icon name="arrow" size={14} />
          </Anchor>
        ) : null}
      </Box>
    </Paper>
  );
}
