"use client";

import { Box, Button, Text, Textarea } from "@mantine/core";
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
    <Box >
      <Box  aria-live="polite">
        {messages.map((item, index) => (
          <Box
            
            key={`${index}-${item.role}`}
          >
            <Text >
              {item.role === "assistant" ? "Study assistant" : "You"}
            </Text>
            <Text>{item.content}</Text>
            {item.role === "assistant" &&
            index === messages.length - 1 &&
            chatMutation.data?.updated ? (
              <Text >Note updated</Text>
            ) : null}
          </Box>
        ))}
        {chatMutation.isPending ? (
          <Text  role="status">
            Thinking about this note…
          </Text>
        ) : null}
      </Box>
      {error ? (
        <Text  role="alert">
          {error}
        </Text>
      ) : null}
      <Box component="form"  onSubmit={handleSubmit}>
        <Textarea
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
        >
          <Icon name="arrow" size={16} />
        </Button>
      </Box>
    </Box>
  );
}
