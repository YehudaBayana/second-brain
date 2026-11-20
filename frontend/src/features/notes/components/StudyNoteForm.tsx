"use client";

import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { Icon } from "@/src/components/Icon";
import { useStudyNoteForm } from "../hooks/useStudyNoteForm";

interface StudyNoteFormProps {
  onSuccess?: () => void;
}

/**
 * StudyNoteForm
 * Encapsulated, hook-driven form for creating study notes.
 * Connects directly to useStudyNoteForm() so no props drilling is needed.
 */
export function StudyNoteForm({ onSuccess }: StudyNoteFormProps = {}) {
  const {
    topics,
    topicId,
    question,
    saveToDeck,
    formError,
    isSubmitting,
    isFormDisabled,
    setTopicId,
    setQuestion,
    setSaveToDeck,
    handleSubmit,
  } = useStudyNoteForm();

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const succeeded = await handleSubmit(event);
    if (succeeded) onSuccess?.();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <Stack gap="md">
        {formError ? (
          <Alert color="red" variant="light" role="alert">
            {formError}
          </Alert>
        ) : null}

        <TextInput
          id="question"
          label="What do you want to understand?"
          maxLength={500}
          required
          value={question}
          onChange={(event) => setQuestion(event.currentTarget.value)}
          placeholder="e.g. What problem does a message queue solve?"
        />

        <Select
          id="topic"
          label="Topic"
          data={topics.map((topic) => ({
            value: topic.id,
            label: topic.name,
          }))}
          required
          value={topicId || null}
          onChange={(value) => setTopicId(value ?? "")}
          placeholder="Select a topic"
        />

        <Group justify="space-between" align="center">
          <Switch
            id="saveToDeck"
            label="Generate quiz cards for review"
            checked={saveToDeck}
            onChange={(event) => setSaveToDeck(event.currentTarget.checked)}
          />
          <Button
            type="submit"
            disabled={isFormDisabled}
            loading={isSubmitting}
            leftSection={<Icon name="sparkle" size={16} />}
          >
            {isSubmitting ? "Generating note…" : "Create study note"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
