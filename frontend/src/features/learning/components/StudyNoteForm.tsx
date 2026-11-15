"use client";

import {
  Alert,
  Button,
  Group,
  SimpleGrid,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { Icon } from "./Icon";
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
    sourceText,
    sourceUrl,
    saveToDeck,
    formError,
    isSubmitting,
    isFormDisabled,
    setTopicId,
    setQuestion,
    setSourceText,
    setSourceUrl,
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

        <Textarea
          id="sourceText"
          label={
            <>
              Your notes or transcript{" "}
              <Text component="span" c="dimmed" size="xs">
                optional
              </Text>
            </>
          }
          maxLength={30000}
          rows={4}
          value={sourceText}
          onChange={(event) => setSourceText(event.currentTarget.value)}
          placeholder="Paste the useful excerpt, your rough notes, or a transcript…"
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
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

          <TextInput
            id="sourceUrl"
            type="url"
            label={
              <>
                Source link{" "}
                <Text component="span" c="dimmed" size="xs">
                  optional
                </Text>
              </>
            }
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.currentTarget.value)}
            placeholder="https://…"
          />
        </SimpleGrid>

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
