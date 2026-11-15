import {
  Anchor,
  Badge,
  Group,
  Paper,
  Stack,
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
    <Paper component="article" h="100%">
      <Stack h="100%" gap="sm">
        <Group justify="space-between" align="center">
          <Badge variant="light" color="indigo">{note.topicName}</Badge>
          <Text size="xs" c="dimmed">{note.formattedDate}</Text>
        </Group>

        <Anchor
          component={Link}
          href={`/notes/${encodeURIComponent(note.id)}`}
          underline="hover"
          c="dark"
          aria-label={`Open note: ${note.displayTitle}`}
        >
          <Title order={3} size="h4">{note.displayTitle}</Title>
        </Anchor>
        <Text size="sm" fw={600}>{note.question}</Text>
        <Text size="sm" c="dimmed" lineClamp={3}>{note.explanation}</Text>

        <Group justify="space-between" mt="auto" pt="sm">
          <Text size="xs" c="dimmed">
            {note.takeawaysCount} key ideas
          </Text>
          {note.hasSourceUrl && note.sourceUrl ? (
            <Anchor
              href={note.sourceUrl}
              target="_blank"
              rel="noreferrer"
              size="xs"
            >
              Open source <Icon name="arrow" size={14} />
            </Anchor>
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );
}
