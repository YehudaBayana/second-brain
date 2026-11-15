import { Box, Code, List, Paper, Text, Title } from "@mantine/core";
import type { CreatedNote } from "../model/types";
import { Icon } from "./Icon";

export function CreatedNotePanel({
  createdNote,
}: {
  createdNote: CreatedNote;
}) {
  return (
    <Paper >
      <Box >
        <Box >
          <Icon name="check" />
        </Box>
        <Box>
          <Text >STUDY NOTE CREATED</Text>
          <Title order={2}>{createdNote.note.title}</Title>
        </Box>
        <Text component="span" >
          {createdNote.note.topicName}
        </Text>
      </Box>
      <Text >
        {createdNote.note.explanation}
      </Text>
      {createdNote.note.keyTakeaways.length > 0 ? (
        <List >
          {createdNote.note.keyTakeaways.map((item, index) => (
            <List.Item key={`${index}-${item}`}>{item}</List.Item>
          ))}
        </List>
      ) : null}
      {createdNote.note.codeExamples.map((example, index) => (
        <Code
          block
          
          key={`${index}-${example.slice(0, 24)}`}
        >
          {example}
        </Code>
      ))}
      <Box >
        <Text>
          {createdNote.cards.length
            ? `${createdNote.cards.length} quiz card${createdNote.cards.length === 1 ? "" : "s"} added — due tomorrow`
            : "Quiz cards were not saved"}
        </Text>
        {createdNote.relatedNotes.length > 0 ? (
          <Text>
            Connected to{" "}
            {createdNote.relatedNotes.map((item) => item.title).join(", ")}
          </Text>
        ) : (
          <Text>Saved in your library</Text>
        )}
      </Box>
    </Paper>
  );
}
