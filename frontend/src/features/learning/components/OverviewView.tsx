"use client";

import { Box, Button, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import Link from "next/link";
import { Icon } from "./Icon";
import { NoteCard } from "./NoteCard";
import { ReviewPrompt } from "./ReviewPrompt";
import { useLearningDashboard } from "../hooks/useLearningDashboard";
import { useOpenStudyAssistant } from "./StudyAssistantContext";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

function StatCard({
  icon,
  color,
  label,
  value,
  description,
}: {
  icon: "book" | "cards" | "clock";
  color: "violet" | "orange" | "green";
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Paper className="stat-card">
      <ThemeIcon className={`stat-icon ${color}`} variant="light">
        <Icon name={icon} />
      </ThemeIcon>
      <Text className="stat-label">{label}</Text>
      <Text component="strong">{value}</Text>
      <Text component="small">{description}</Text>
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
    <Box className="overview-view">
      <Box className="page-heading">
        <Box>
          <Text className="eyebrow">YOUR KNOWLEDGE, IN ONE PLACE</Text>
          <Title>Good to see you, {greetingName}.</Title>
          <Text>
            Keep following your curiosity. We’ll help the good ideas stick.
          </Text>
        </Box>
        <Button
          component={Link}
          href="/library"
          className="button button-outline"
          variant="default"
          leftSection={<Icon name="library" size={16} />}
        >
          Browse library
        </Button>
      </Box>

      {/* Stats Grid */}
      <Box className="stats-grid" aria-label="Learning overview">
        <StatCard
          icon="book"
          color="violet"
          label="Saved notes"
          value={stats.notes}
          description="Ideas worth keeping"
        />
        <StatCard
          icon="cards"
          color="orange"
          label="Quiz cards"
          value={stats.cards}
          description="Built from your notes"
        />
        <StatCard
          icon="clock"
          color="green"
          label="Due to review"
          value={stats.dueToday}
          description={
            stats.dueToday === 1 ? "A quick review today" : "Ready when you are"
          }
        />
      </Box>

      {/* Review actions */}
      <Box className="dashboard-columns">
        <ReviewPrompt
          dueToday={stats.dueToday}
          onSaveIdea={openStudyAssistant}
        />
      </Box>

      {/* Recent Notes Section */}
      {notes.length > 0 ? (
        <Box className="recent-notes-section" mt="xl">
          <Box className="section-title-row">
            <Box>
              <Text className="eyebrow">RECENTLY ADDED</Text>
              <Title order={2}>Fresh in your mind</Title>
            </Box>
            <Button
              component={Link}
              href="/library"
              variant="default"
              rightSection={<Icon name="arrow" size={14} />}
            >
              View all {notes.length} notes
            </Button>
          </Box>
          <Box className="notes-grid">
            {notes.slice(0, 3).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

export default OverviewView;
