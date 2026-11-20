"use client";

import {
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { Icon } from "@/src/components/Icon";
import { NoteCard } from "@/src/features/notes/components/NoteCard";
import { useNotes } from "../query/useNotes";
import { useTopics } from "../query/useNotes";
import { useLearningStats } from "@/src/features/dashboard/query/useDashboard";
import { ViewSkeleton } from "@/src/components/feedback/ViewSkeleton";

/**
 * LibraryView
 * Dedicated view displaying all saved notes in the user's personal knowledge base.
 * Hook-driven with zero required props.
 */
export function LibraryView() {
  const notesQuery = useNotes();
  const topicsQuery = useTopics();
  const statsQuery = useLearningStats();
  const notes = notesQuery.data ?? [];
  const topics = topicsQuery.data ?? [];
  const stats = statsQuery.data ?? {
    notes: 0,
    cards: 0,
    dueToday: 0,
    topics: 0,
  };
  const isLoading =
    notesQuery.isPending || topicsQuery.isPending || statsQuery.isPending;

  if (isLoading) {
    return <ViewSkeleton view="library" />;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center" gap="lg" wrap="wrap">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
            Your personal knowledge base
          </Text>
          <Title order={1}>All notes</Title>
          <Text c="dimmed">
            {stats.notes} notes across {topics.length} topics. Keep the ideas
            you’ll want to find again.
          </Text>
        </Stack>
        <Button
          component={Link}
          href="/"
          leftSection={<Icon name="plus" size={16} />}
        >
          Add a note
        </Button>
      </Group>

      {notes.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </SimpleGrid>
      ) : (
        <Paper>
          <Stack align="center" ta="center" gap="sm" py="xl">
            <ThemeIcon size={56} variant="light" color="indigo">
              <Icon name="book" size={22} />
            </ThemeIcon>
            <Title order={3}>Your library is ready for its first idea.</Title>
            <Text c="dimmed">
              Start with a question or something you just learned.
            </Text>
            <Button component={Link} href="/">
              Create your first note
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export default LibraryView;
