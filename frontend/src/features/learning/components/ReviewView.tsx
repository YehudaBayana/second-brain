"use client";

import {
  Box,
  Button,
  Paper,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { useFlashcardReview } from "../hooks/useFlashcardReview";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";

function GradeButton({
  label,
  hint,
  className,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  className: string;
  icon: IconName;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      className={`grade-button ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <Box className="grade-icon">
        <Icon name={icon} />
      </Box>
      <Text component="strong">{label}</Text>
      <Text component="small">{hint}</Text>
    </UnstyledButton>
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
    <Box className="review-view">
      <Box className="page-heading">
        <Box>
          <Text className="eyebrow">SPACED REPETITION</Text>
          <Title>Time to remember</Title>
          <Text>
            Try to recall the answer before you reveal it. Every attempt is
            practice.
          </Text>
        </Box>
        <Box className="review-total">
          <Icon name="cards" /> {remainingCount} remaining
        </Box>
      </Box>

      {sessionError ? (
        <Box className="error-banner" role="alert" mb="md">
          <Text>{sessionError}</Text>
          <Button variant="subtle" size="xs" onClick={clearError}>
            Dismiss
          </Button>
        </Box>
      ) : null}

      {currentCard ? (
        <Paper component="article" className="quiz-card">
          <Box className="quiz-meta">
            <Text component="span" className="topic-pill">
              {currentCard.topicName}
            </Text>
            <Text>
              Card {stats.dueToday - remainingCount + 1} of {stats.dueToday}
            </Text>
          </Box>

          <Box className="quiz-content">
            <Text className="eyebrow">QUESTION</Text>
            <Title order={2}>{currentCard.frontQuestion}</Title>
            {isRevealed ? (
              <Box className="answer-block">
                <Text className="eyebrow">ANSWER</Text>
                <Text>{currentCard.backAnswer}</Text>
              </Box>
            ) : (
              <Text className="think-prompt">
                Take a breath and think it through before revealing.
              </Text>
            )}
          </Box>

          {!isRevealed ? (
            <Button
              className="button button-primary reveal-button"
              onClick={reveal}
              rightSection={<Icon name="arrow" size={16} />}
            >
              Reveal answer
            </Button>
          ) : (
            <Box className="grade-actions">
              <GradeButton
                label="Forgot"
                hint={currentCard.getIntervalDescription("forgot")}
                className="forgot"
                icon="forgot"
                disabled={isGrading}
                onClick={() => gradeCurrentCard("forgot")}
              />
              <GradeButton
                label="Got it"
                hint={currentCard.getIntervalDescription("got_it")}
                className="got-it"
                icon="check"
                disabled={isGrading}
                onClick={() => gradeCurrentCard("got_it")}
              />
              <GradeButton
                label="Too easy"
                hint={currentCard.getIntervalDescription("too_easy")}
                className="too-easy"
                icon="easy"
                disabled={isGrading}
                onClick={() => gradeCurrentCard("too_easy")}
              />
            </Box>
          )}

          <Box className="quiz-card-footer">
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
        <Paper className="empty-panel">
          <Box className="empty-icon-wrap">
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
            className="button button-primary"
          >
            Back to overview
          </Button>
        </Paper>
      )}
    </Box>
  );
}

export default ReviewView;
