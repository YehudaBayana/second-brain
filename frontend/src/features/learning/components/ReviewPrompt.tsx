import { Box, Button, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import Link from "next/link";
import { Icon } from "./Icon";

interface ReviewPromptProps {
  dueToday: number;
  onSaveIdea?: () => void;
}

export function ReviewPrompt({ dueToday, onSaveIdea }: ReviewPromptProps) {
  const handleSaveIdea = () => {
    if (onSaveIdea) {
      onSaveIdea();
    } else {
      document.getElementById("question")?.focus();
    }
  };

  return (
    <Paper className="panel review-panel">
      <Box className="panel-heading">
        <Box>
          <Text className="eyebrow">A LITTLE PRACTICE</Text>
          <Title order={2}>Make it memorable</Title>
        </Box>
        <ThemeIcon className="heading-icon warm" variant="light">
          <Icon name="cards" />
        </ThemeIcon>
      </Box>

      <Box className="review-illustration">
        <Icon name="clock" size={26} />
        <Box className="orbit-dot" />
      </Box>

      {dueToday > 0 ? (
        <>
          <Title order={3}>
            {dueToday} card{dueToday === 1 ? "" : "s"} ready when you are
          </Title>
          <Text>
            Take a moment to recall before revealing the answer. That effort
            helps new ideas settle in.
          </Text>
          <Button
            component={Link}
            href="/review"
            className="button button-primary full-button"
            rightSection={<Icon name="arrow" size={16} />}
          >
            Start a review
          </Button>
        </>
      ) : (
        <>
          <Title order={3}>You’re all caught up</Title>
          <Text>
            When you save notes with quiz cards, they’ll show up here when it’s
            time to revisit them.
          </Text>
          <Button
            className="button button-outline full-button"
            variant="default"
            onClick={handleSaveIdea}
            rightSection={<Icon name="arrow" size={16} />}
          >
            Save a new idea
          </Button>
        </>
      )}

      <Box className="review-note">
        <Icon name="sparkle" size={15} />
        <Text component="span">
          Consistency matters more than long sessions.
        </Text>
      </Box>
    </Paper>
  );
}
