import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { Icon } from "@/src/components/Icon";

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
    <Paper bg="indigo.0">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
              A little practice
            </Text>
            <Title order={2}>Make it memorable</Title>
          </Stack>
          <ThemeIcon size={48} variant="light" color="indigo">
            <Icon name="cards" />
          </ThemeIcon>
        </Group>

        <Group gap="sm">
          <Badge leftSection={<Icon name="clock" size={13} />} color="indigo" variant="light">
            {dueToday} due today
          </Badge>
          <Text size="sm" c="dimmed">
            {dueToday > 0 ? "A quick review helps ideas stick." : "You’re all caught up."}
          </Text>
        </Group>

        {dueToday > 0 ? (
          <Stack gap="sm">
            <Title order={3}>
              {dueToday} card{dueToday === 1 ? "" : "s"} ready when you are
            </Title>
            <Text c="dimmed">
              Take a moment to recall before revealing the answer. That effort
              helps new ideas settle in.
            </Text>
            <Button
              component={Link}
              href="/review"
              w="fit-content"
              rightSection={<Icon name="arrow" size={16} />}
            >
              Start a review
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Title order={3}>You’re all caught up</Title>
            <Text c="dimmed">
              When you save notes with quiz cards, they’ll show up here when it’s
              time to revisit them.
            </Text>
            <Button
              variant="default"
              onClick={handleSaveIdea}
              w="fit-content"
              rightSection={<Icon name="arrow" size={16} />}
            >
              Save a new idea
            </Button>
          </Stack>
        )}

        <Text size="xs" c="dimmed">
          <Icon name="sparkle" size={15} />{" "}
          Consistency matters more than long sessions.
        </Text>
      </Stack>
    </Paper>
  );
}
