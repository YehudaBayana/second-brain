"use client";

import { Box, Button, Code, List, Paper, Text, Title } from "@mantine/core";
import Link from "next/link";
import { LearningViewSkeleton } from "@/src/components/feedback/LearningViewSkeleton";
import { NoteEntity } from "@/src/domain/entities/NoteEntity";
import { useNote } from "../query/useLearning";
import { Icon } from "./Icon";
import { NoteChat } from "./NoteChat";

export function NoteDetailView({ noteId }: { noteId: string }) {
  const query = useNote(noteId);

  if (query.isPending) {
    return <LearningViewSkeleton view="library" />;
  }
  if (query.isError) {
    return (
      <Paper  role="alert">
        <Title order={3}>Could not open this note</Title>
        <Text>{query.error.message}</Text>
        <Button component={Link} href="/library" variant="default">
          Back to library
        </Button>
      </Paper>
    );
  }

  const { note: loadedNote, cards } = query.data;
  const note = loadedNote;
  const entity = NoteEntity.fromRaw(note);

  return (
    <Box >
      <Box >
        <Box>
          <Text >{entity.topicName}</Text>
          <Title>{entity.displayTitle}</Title>
          <Text>{entity.formattedDate}</Text>
        </Box>
        <Button
          component={Link}
          href="/library"
          variant="default"
          leftSection={<Icon name="arrow" size={14} />}
        >
          Back to library
        </Button>
      </Box>

      <Paper >
        <Text >YOUR QUESTION</Text>
        <Title order={2}>{note.question}</Title>
        <Text >STUDY NOTE</Text>
        <Text >{note.explanation}</Text>

        {note.keyTakeaways.length > 0 ? (
          <Box >
            <Title order={3}>Key takeaways</Title>
            <List >
              {note.keyTakeaways.map((item, index) => (
                <List.Item key={`${index}-${item}`}>{item}</List.Item>
              ))}
            </List>
          </Box>
        ) : null}

        {note.codeExamples.length > 0 ? (
          <Box >
            <Title order={3}>Examples</Title>
            {note.codeExamples.map((example, index) => (
              <Code
                block
                
                key={`${index}-${example.slice(0, 24)}`}
              >
                {example}
              </Code>
            ))}
          </Box>
        ) : null}

        <Box >
          <Title order={3}>Source material</Title>
          {note.sourceText ? (
            <Text >{note.sourceText}</Text>
          ) : (
            <Text >No source text was added.</Text>
          )}
          {note.sourceUrl ? (
            <Button
              component="a"
              href={note.sourceUrl}
              target="_blank"
              rel="noreferrer"
              variant="default"
              rightSection={<Icon name="arrow" size={14} />}
            >
              Open source
            </Button>
          ) : null}
        </Box>

        {cards.length > 0 ? (
          <Box >
            <Title order={3}>Review cards</Title>
            <Box >
              {cards.map((card) => (
                <Paper  key={card.id}>
                  <Text >QUESTION</Text>
                  <Text>{card.frontQuestion}</Text>
                  <Text >ANSWER</Text>
                  <Text>{card.backAnswer}</Text>
                  <Text >
                    Next review: {card.nextReviewDate}
                  </Text>
                </Paper>
              ))}
            </Box>
          </Box>
        ) : null}
      </Paper>

      <Paper >
        <Text >KEEP EXPLORING</Text>
        <Title order={2}>Ask about this note</Title>
        <Text >
          Follow-up answers use this note and your conversation as context.
          Useful changes can be added to the saved note automatically.
        </Text>
        <NoteChat
          key={note.id}
          note={note}
        />
      </Paper>
    </Box>
  );
}
