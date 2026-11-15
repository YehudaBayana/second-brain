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
    }
  };

  return (
    <Paper >
      <Box >
        <Box>
          <Text >A LITTLE PRACTICE</Text>
          <Title order={2}>Make it memorable</Title>
        </Box>
        <ThemeIcon  variant="light">
          <Icon name="cards" />
        </ThemeIcon>
      </Box>

      <Box >
        <Icon name="clock" size={26} />
        <Box  />
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
            
            variant="default"
            onClick={handleSaveIdea}
            rightSection={<Icon name="arrow" size={16} />}
          >
            Save a new idea
          </Button>
        </>
      )}

      <Box >
        <Icon name="sparkle" size={15} />
        <Text component="span">
          Consistency matters more than long sessions.
        </Text>
      </Box>
    </Paper>
  );
}
