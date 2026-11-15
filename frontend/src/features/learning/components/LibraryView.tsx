"use client";

import { Box, Button, Paper, Text, ThemeIcon, Title } from "@mantine/core";
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
    <Box >
      <Box >
        <Box>
          <Text >YOUR PERSONAL KNOWLEDGE BASE</Text>
          <Title>My library</Title>
          <Text>
            {stats.notes} notes across {topics.length} topics. Keep the ideas
            you’ll want to find again.
          </Text>
        </Box>
        <Button
          component={Link}
          href="/"
          
          leftSection={<Icon name="plus" size={16} />}
        >
          Add a note
        </Button>
      </Box>

      {notes.length > 0 ? (
        <Box >
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </Box>
      ) : (
        <Paper >
          <ThemeIcon  variant="light">
            <Icon name="book" size={22} />
          </ThemeIcon>
          <Title order={3}>Your library is ready for its first idea.</Title>
          <Text>Start with a question or something you just learned.</Text>
          <Button
            component={Link}
            href="/"
            
          >
            Create your first note
          </Button>
        </Paper>
      )}
    </Box>
  );
}

export default LibraryView;
