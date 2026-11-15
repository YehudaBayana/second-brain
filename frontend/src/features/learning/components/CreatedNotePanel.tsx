import {
  Badge,
  Code,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import type { CreatedNote } from "../model/types";
import { Icon } from "./Icon";

export function CreatedNotePanel({
  createdNote,
}: {
  createdNote: CreatedNote;
}) {
  return (
    <Paper>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Group align="flex-start" gap="sm">
            <ThemeIcon size="lg" variant="light" color="teal">
              <Icon name="check" />
            </ThemeIcon>
            <Stack gap={4}>
              <Text size="xs" fw={700} tt="uppercase" c="teal.7">
                Study note created
              </Text>
              <Title order={2}>{createdNote.note.title}</Title>
            </Stack>
          </Group>
          <Badge variant="light" color="indigo">
            {createdNote.note.topicName}
          </Badge>
        </Group>
        <Text>{createdNote.note.explanation}</Text>
        {createdNote.note.keyTakeaways.length > 0 ? (
          <List withPadding spacing="xs">
            {createdNote.note.keyTakeaways.map((item, index) => (
              <List.Item key={`${index}-${item}`}>{item}</List.Item>
            ))}
          </List>
        ) : null}
        {createdNote.note.codeExamples.map((example, index) => (
          <Code
            block
            p="md"
            key={`${index}-${example.slice(0, 24)}`}
          >
            {example}
          </Code>
        ))}
        <Paper p="md" bg="gray.0">
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              {createdNote.cards.length
                ? `${createdNote.cards.length} quiz card${createdNote.cards.length === 1 ? "" : "s"} added — due tomorrow`
                : "Quiz cards were not saved"}
            </Text>
            {createdNote.relatedNotes.length > 0 ? (
              <Text size="sm" c="dimmed">
                Connected to{" "}
                {createdNote.relatedNotes.map((item) => item.title).join(", ")}
              </Text>
            ) : (
              <Text size="sm" c="dimmed">Saved in your library</Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
