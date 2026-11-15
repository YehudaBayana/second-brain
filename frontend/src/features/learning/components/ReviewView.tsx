"use client";

import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { useFlashcardReview } from "../hooks/useFlashcardReview";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

function GradeButton({
  label,
  hint,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  icon: IconName;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="default"
      fullWidth
      size="md"
      disabled={disabled}
      onClick={onClick}
      leftSection={<Icon name={icon} />}
    >
      <Stack gap={0} align="flex-start">
        <Text component="strong">{label}</Text>
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      </Stack>
    </Button>
  );
}

/**
 * ReviewView
 * Dedicated spaced-repetition flashcard review screen.
 * Consumes useFlashcardReview() with zero props drilling and uses OOP FlashcardEntity methods.
 */
export function ReviewView() {
  const {
    currentCard,
    remainingCount,
    stats,
    isRevealed,
    sessionError,
    isGrading,
    reveal,
    gradeCurrentCard,
    clearError,
    isLoading,
  } = useFlashcardReview();

  if (isLoading) {
    return <LearningViewSkeleton view="review" />;
  }

  return (
    <Stack gap="md" maw={760} mx="auto">
      <Group justify="space-between" align="flex-end">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
            Spaced repetition
          </Text>
          <Title order={1}>Time to remember</Title>
          <Text c="dimmed">
            Try to recall the answer before you reveal it. Every attempt is
            practice.
          </Text>
        </Stack>
        <Text size="sm" c="dimmed">
          <Icon name="cards" /> {remainingCount} remaining
        </Text>
      </Group>

      {sessionError ? (
        <Alert color="red" variant="light" role="alert">
          {sessionError}
          <Button variant="subtle" size="xs" onClick={clearError}>
            Dismiss
          </Button>
        </Alert>
      ) : null}

      {currentCard ? (
        <Paper component="article">
          <Stack gap="xl">
            <Group justify="space-between">
              <Text size="sm" fw={600} c="indigo.7">
              {currentCard.topicName}
              </Text>
              <Text size="sm" c="dimmed">
              Card {stats.dueToday - remainingCount + 1} of {stats.dueToday}
              </Text>
            </Group>

            <Stack gap="md">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Question
              </Text>
              <Title order={2}>{currentCard.frontQuestion}</Title>
            {isRevealed ? (
              <Paper p="md" bg="gray.0">
                <Stack gap="xs">
                  <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
                    Answer
                  </Text>
                  <Text>{currentCard.backAnswer}</Text>
                </Stack>
              </Paper>
            ) : (
              <Text c="dimmed" size="sm">
                Take a breath and think it through before revealing.
              </Text>
            )}
            </Stack>

          {!isRevealed ? (
            <Button
              onClick={reveal}
              rightSection={<Icon name="arrow" size={16} />}
            >
              Reveal answer
            </Button>
          ) : (
            <Group grow>
              <GradeButton
                label="Forgot"
                hint={currentCard.getIntervalDescription("forgot")}
                
                icon="forgot"
                disabled={isGrading}
                onClick={() => gradeCurrentCard("forgot")}
              />
              <GradeButton
                label="Got it"
                hint={currentCard.getIntervalDescription("got_it")}
                
                icon="check"
                disabled={isGrading}
                onClick={() => gradeCurrentCard("got_it")}
              />
              <GradeButton
                label="Too easy"
                hint={currentCard.getIntervalDescription("too_easy")}
                
                icon="easy"
                disabled={isGrading}
                onClick={() => gradeCurrentCard("too_easy")}
              />
            </Group>
          )}

            <Group justify="space-between" c="dimmed">
              <Text size="xs">
                From note:{" "}
                <Text component="span" fw={600}>
                  {currentCard.noteTitle}
                </Text>
              </Text>
              <Text size="xs">
                Memory level:{" "}
                <Text component="span" fw={600}>
                  {currentCard.memoryLevel} / 5
                </Text>
              </Text>
            </Group>
          </Stack>
        </Paper>
      ) : (
        <Paper>
          <Stack align="center" ta="center" gap="sm" py="xl">
            <Icon name="check" size={28} />
          <Title order={3}>All caught up for today.</Title>
          <Text c="dimmed">
            You finished every card scheduled for review. Taking a break gives
            memory time to consolidate.
          </Text>
          <Button
            component={Link}
            href="/"
          >
            Back to overview
          </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export default ReviewView;
