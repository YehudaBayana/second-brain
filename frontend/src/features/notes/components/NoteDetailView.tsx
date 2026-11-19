"use client";

import {
  Alert,
  Badge,
  Button,
  Code,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { ViewSkeleton } from "@/src/components/feedback/ViewSkeleton";
import { NoteEntity } from "../model/NoteEntity";
import { useNote } from "../query/useNotes";
import { Icon } from "@/src/components/Icon";
import { NoteChat } from "@/src/features/assistant/components/NoteChat";

export function NoteDetailView({ noteId }: { noteId: string }) {
  const query = useNote(noteId);

  if (query.isPending) {
    return <ViewSkeleton view="library" />;
  }
  if (query.isError) {
    return (
      <Alert color="red" variant="light" title="Could not open this note" role="alert">
        <Stack gap="sm">
          <Text>{query.error.message}</Text>
          <Button
            component={Link}
            href="/library"
            variant="default"
            w="fit-content"
          >
            Back to library
          </Button>
        </Stack>
      </Alert>
    );
  }

  const { note: loadedNote, cards } = query.data;
  const note = loadedNote;
  const entity = NoteEntity.fromRaw(note);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs">
          <Badge variant="light" color="indigo">{entity.topicName}</Badge>
          <Title order={1}>{entity.displayTitle}</Title>
          <Text size="sm" c="dimmed">{entity.formattedDate}</Text>
        </Stack>
        <Button
          component={Link}
          href="/library"
          variant="default"
          leftSection={<Icon name="arrow" size={14} />}
        >
          Back to library
        </Button>
      </Group>

      <Paper>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
              Your question
            </Text>
            <Title order={2}>{note.question}</Title>
          </Stack>
          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
              Study note
            </Text>
            <Text>{note.explanation}</Text>
          </Stack>

        {note.keyTakeaways.length > 0 ? (
          <Stack gap="sm">
            <Title order={3}>Key takeaways</Title>
            <List withPadding spacing="xs">
              {note.keyTakeaways.map((item, index) => (
                <List.Item key={`${index}-${item}`}>{item}</List.Item>
              ))}
            </List>
          </Stack>
        ) : null}

        {note.codeExamples.length > 0 ? (
          <Stack gap="sm">
            <Title order={3}>Examples</Title>
            {note.codeExamples.map((example, index) => (
              <Code
                block
                p="md"
                key={`${index}-${example.slice(0, 24)}`}
              >
                {example}
              </Code>
            ))}
          </Stack>
        ) : null}

        <Stack gap="sm">
          <Title order={3}>Source material</Title>
          {note.sourceText ? (
            <Text c="dimmed">{note.sourceText}</Text>
          ) : (
            <Text c="dimmed">No source text was added.</Text>
          )}
          {note.sourceUrl ? (
            <Button
              component="a"
              href={note.sourceUrl}
              target="_blank"
              rel="noreferrer"
              variant="default"
              rightSection={<Icon name="arrow" size={14} />}
            >
              Open source
            </Button>
          ) : null}
        </Stack>

        {cards.length > 0 ? (
          <Stack gap="sm">
            <Title order={3}>Review cards</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {cards.map((card) => (
                <Paper key={card.id} p="md" bg="gray.0">
                  <Stack gap="sm">
                    <Stack gap={4}>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Question
                      </Text>
                      <Text>{card.frontQuestion}</Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Answer
                      </Text>
                      <Text>{card.backAnswer}</Text>
                    </Stack>
                    <Text size="xs" c="dimmed">
                      Next review: {card.nextReviewDate}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        ) : null}
        </Stack>
      </Paper>

      <Paper>
        <Stack gap="md">
          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
              Keep exploring
            </Text>
            <Title order={2}>Ask about this note</Title>
            <Text c="dimmed">
              Follow-up answers use this note and your conversation as context.
              Useful changes can be added to the saved note automatically.
            </Text>
          </Stack>
          <NoteChat key={note.id} note={note} />
        </Stack>
      </Paper>
    </Stack>
  );
}
