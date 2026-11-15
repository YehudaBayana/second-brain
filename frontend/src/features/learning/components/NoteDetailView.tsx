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
      <Paper className="empty-panel" role="alert">
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
    <Box className="note-detail-view">
      <Box className="page-heading note-detail-heading">
        <Box>
          <Text className="eyebrow">{entity.topicName}</Text>
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

      <Paper className="panel note-detail-content-panel">
        <Text className="eyebrow">YOUR QUESTION</Text>
        <Title order={2}>{note.question}</Title>
        <Text className="eyebrow note-content-eyebrow">STUDY NOTE</Text>
        <Text className="note-detail-explanation">{note.explanation}</Text>

        {note.keyTakeaways.length > 0 ? (
          <Box className="note-detail-section">
            <Title order={3}>Key takeaways</Title>
            <List className="takeaway-list">
              {note.keyTakeaways.map((item, index) => (
                <List.Item key={`${index}-${item}`}>{item}</List.Item>
              ))}
            </List>
          </Box>
        ) : null}

        {note.codeExamples.length > 0 ? (
          <Box className="note-detail-section">
            <Title order={3}>Examples</Title>
            {note.codeExamples.map((example, index) => (
              <Code
                block
                className="code-example"
                key={`${index}-${example.slice(0, 24)}`}
              >
                {example}
              </Code>
            ))}
          </Box>
        ) : null}

        <Box className="note-detail-section">
          <Title order={3}>Source material</Title>
          {note.sourceText ? (
            <Text className="note-source-text">{note.sourceText}</Text>
          ) : (
            <Text className="muted-copy">No source text was added.</Text>
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
          <Box className="note-detail-section">
            <Title order={3}>Review cards</Title>
            <Box className="note-detail-cards">
              {cards.map((card) => (
                <Paper className="note-review-card" key={card.id}>
                  <Text className="eyebrow">QUESTION</Text>
                  <Text>{card.frontQuestion}</Text>
                  <Text className="eyebrow">ANSWER</Text>
                  <Text>{card.backAnswer}</Text>
                  <Text className="muted-copy">
                    Next review: {card.nextReviewDate}
                  </Text>
                </Paper>
              ))}
            </Box>
          </Box>
        ) : null}
      </Paper>

      <Paper className="panel note-detail-chat-panel">
        <Text className="eyebrow">KEEP EXPLORING</Text>
        <Title order={2}>Ask about this note</Title>
        <Text className="assistant-intro">
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
