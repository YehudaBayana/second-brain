"use client";

import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useState, type FormEvent } from "react";
import { useChatAboutNote } from "../query/useLearning";
import type { Note, NoteChatMessage } from "../model/types";
import { Icon } from "./Icon";

export function NoteChat({
  note,
  onNoteUpdate,
}: {
  note: Note;
  onNoteUpdate?: (note: Note) => void;
}) {
  const [messages, setMessages] = useState<NoteChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chatMutation = useChatAboutNote();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = message.trim();
    if (!prompt || chatMutation.isPending) return;

    setError(null);
    setMessage("");
    setMessages((current) => [...current, { role: "user", content: prompt }]);
    try {
      const result = await chatMutation.mutateAsync({
        noteId: note.id,
        message: prompt,
        history: messages.slice(-20),
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.answer },
      ]);
      onNoteUpdate?.(result.note);
    } catch (cause) {
      setMessages((current) => current.slice(0, -1));
      setMessage(prompt);
      setError(
        cause instanceof Error ? cause.message : "Could not get an answer.",
      );
    }
  };

  return (
    <Stack gap="md">
      <Stack gap="sm" aria-live="polite">
        {messages.map((item, index) => (
          <Group
            key={`${index}-${item.role}`}
            justify={item.role === "user" ? "flex-end" : "flex-start"}
          >
            <Paper
              p="sm"
              maw="85%"
              bg={item.role === "user" ? "indigo.0" : "gray.0"}
            >
              <Stack gap={4}>
                <Text size="xs" fw={600} c="dimmed">
                  {item.role === "assistant" ? "Study assistant" : "You"}
                </Text>
                <Text size="sm">{item.content}</Text>
                {item.role === "assistant" &&
                index === messages.length - 1 &&
                chatMutation.data?.updated ? (
                  <Text size="xs" c="indigo.7">Note updated</Text>
                ) : null}
              </Stack>
            </Paper>
          </Group>
        ))}
        {chatMutation.isPending ? (
          <Text size="sm" c="dimmed" role="status">
            Thinking about this note…
          </Text>
        ) : null}
      </Stack>
      {error ? (
        <Alert color="red" variant="light" role="alert">{error}</Alert>
      ) : null}
      <form onSubmit={handleSubmit}>
        <Group align="flex-end">
          <Textarea
            flex={1}
            aria-label="Ask a follow-up question about this note"
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
            placeholder="Ask a follow-up about this note…"
            maxLength={2000}
            minRows={2}
            maxRows={5}
            autosize
          />
          <Button
            type="submit"
            aria-label="Send follow-up question"
            disabled={!message.trim() || chatMutation.isPending}
            loading={chatMutation.isPending}
            px="sm"
          >
            <Icon name="arrow" size={16} />
          </Button>
        </Group>
      </form>
    </Stack>
  );
}
