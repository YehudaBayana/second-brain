"use client";

import {
  Box,
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
      disabled={disabled}
      onClick={onClick}
      leftSection={<Icon name={icon} />}
    >
      <Stack gap={0}>
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
      <Box >
        <Box>
          <Text >SPACED REPETITION</Text>
          <Title>Time to remember</Title>
          <Text>
            Try to recall the answer before you reveal it. Every attempt is
            practice.
          </Text>
        </Box>
        <Group gap="xs">
          <Icon name="cards" /> {remainingCount} remaining
        </Group>
      </Box>

      {sessionError ? (
        <Box  role="alert" mb="md">
          <Text>{sessionError}</Text>
          <Button variant="subtle" size="xs" onClick={clearError}>
            Dismiss
          </Button>
        </Box>
      ) : null}

      {currentCard ? (
        <Paper component="article" >
          <Box >
            <Text component="span" >
              {currentCard.topicName}
            </Text>
            <Text>
              Card {stats.dueToday - remainingCount + 1} of {stats.dueToday}
            </Text>
          </Box>

          <Box >
            <Text >QUESTION</Text>
            <Title order={2}>{currentCard.frontQuestion}</Title>
            {isRevealed ? (
              <Box >
                <Text >ANSWER</Text>
                <Text>{currentCard.backAnswer}</Text>
              </Box>
            ) : (
              <Text >
                Take a breath and think it through before revealing.
              </Text>
            )}
          </Box>

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

          <Box >
            <Text>
              From note:{" "}
              <Text component="strong">{currentCard.noteTitle}</Text>
            </Text>
            <Text>
              Memory level:{" "}
              <Text component="strong">{currentCard.memoryLevel} / 5</Text>
            </Text>
          </Box>
        </Paper>
      ) : (
        <Paper >
          <Box >
            <Icon name="check" size={28} />
          </Box>
          <Title order={3}>All caught up for today.</Title>
          <Text>
            You finished every card scheduled for review. Taking a break gives
            memory time to consolidate.
          </Text>
          <Button
            component={Link}
            href="/"
            
          >
            Back to overview
          </Button>
        </Paper>
      )}
    </Stack>
  );
}

export default ReviewView;
