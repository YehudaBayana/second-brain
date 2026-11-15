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
import { ReviewPrompt } from "./ReviewPrompt";
import { useLearningDashboard } from "../hooks/useLearningDashboard";
import { useOpenStudyAssistant } from "./StudyAssistantContext";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: "book" | "cards" | "clock";
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Paper>
      <Group align="flex-start" gap="md">
        <ThemeIcon size={48} variant="light" color="indigo">
          <Icon name={icon} />
        </ThemeIcon>
        <Stack gap={4}>
          <Text size="sm" c="dimmed">{label}</Text>
          <Text size="xl" fw={700} lh={1}>{value}</Text>
          <Text size="xs" c="dimmed">{description}</Text>
        </Stack>
      </Group>
    </Paper>
  );
}

/**
 * OverviewView
 * Clean, hook-driven dashboard for the main learning overview.
 */
export function OverviewView() {
  const { greetingName, notes, stats, isLoading } = useLearningDashboard();
  const openStudyAssistant = useOpenStudyAssistant();

  if (isLoading) {
    return <LearningViewSkeleton view="overview" />;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center" gap="lg" wrap="wrap">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
            Your knowledge, in one place
          </Text>
          <Title order={1}>Good to see you, {greetingName}.</Title>
          <Text c="dimmed" maw={640}>
            Keep following your curiosity. We’ll help the good ideas stick.
          </Text>
        </Stack>
        <Button
          component={Link}
          href="/library"
          variant="default"
          leftSection={<Icon name="library" size={16} />}
        >
          Browse library
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" aria-label="Learning overview">
        <StatCard
          icon="book"
          label="Saved notes"
          value={stats.notes}
          description="Ideas worth keeping"
        />
        <StatCard
          icon="cards"
          label="Quiz cards"
          value={stats.cards}
          description="Built from your notes"
        />
        <StatCard
          icon="clock"
          label="Due to review"
          value={stats.dueToday}
          description={
            stats.dueToday === 1 ? "A quick review today" : "Ready when you are"
          }
        />
      </SimpleGrid>

      <ReviewPrompt
        dueToday={stats.dueToday}
        onSaveIdea={openStudyAssistant}
      />

      {notes.length > 0 ? (
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
                Recently added
              </Text>
              <Title order={2}>Fresh in your mind</Title>
            </Stack>
            <Button
              component={Link}
              href="/library"
              variant="default"
              size="sm"
              rightSection={<Icon name="arrow" size={14} />}
            >
              View all {notes.length} notes
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {notes.slice(0, 3).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}
    </Stack>
  );
}

export default OverviewView;
