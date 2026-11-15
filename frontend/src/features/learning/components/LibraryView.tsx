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
import { Icon } from "./Icon";
import { NoteCard } from "./NoteCard";
import { useLearningDashboard } from "../hooks/useLearningDashboard";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

/**
 * LibraryView
 * Dedicated view displaying all saved notes in the user's personal knowledge base.
 * Hook-driven with zero required props.
 */
export function LibraryView() {
  const { notes, topics, stats, isLoading } = useLearningDashboard();

  if (isLoading) {
    return <LearningViewSkeleton view="library" />;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center" gap="lg" wrap="wrap">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
            Your personal knowledge base
          </Text>
          <Title order={1}>My library</Title>
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
            <Text c="dimmed">Start with a question or something you just learned.</Text>
          <Button
            component={Link}
            href="/"
          >
            Create your first note
          </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export default LibraryView;
