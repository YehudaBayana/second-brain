"use client";

import {
  Box,
  Button,
  Select,
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
    await handleSubmit(event);
    if (onSuccess) onSuccess();
  };

  return (
    <Box component="form" onSubmit={handleFormSubmit} className="capture-form">
      {formError ? (
        <Box className="error-banner" role="alert" mb="sm">
          <Text>{formError}</Text>
        </Box>
      ) : null}

      <TextInput
        id="question"
        label="What do you want to understand?"
        classNames={{ label: "field-label" }}
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
            <Text component="span" className="optional-label">
              optional
            </Text>
          </>
        }
        classNames={{ label: "field-label" }}
        maxLength={30000}
        rows={4}
        value={sourceText}
        onChange={(event) => setSourceText(event.currentTarget.value)}
        placeholder="Paste the useful excerpt, your rough notes, or a transcript…"
      />

      <Box className="form-row">
        <Box className="form-field grow">
          <Select
            id="topic"
            label="Topic"
            classNames={{ label: "field-label" }}
            data={topics.map((topic) => ({
              value: topic.id,
              label: topic.name,
            }))}
            required
            value={topicId || null}
            onChange={(value) => setTopicId(value ?? "")}
            placeholder="Select a topic"
          />
        </Box>

        <Box className="form-field grow">
          <TextInput
            id="sourceUrl"
            type="url"
            label={
              <>
                Source link{" "}
                <Text component="span" className="optional-label">
                  optional
                </Text>
              </>
            }
            classNames={{ label: "field-label" }}
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.currentTarget.value)}
            placeholder="https://…"
          />
        </Box>
      </Box>

      <Box className="form-footer">
        <Switch
          id="saveToDeck"
          label="Generate quiz cards for review"
          checked={saveToDeck}
          onChange={(event) => setSaveToDeck(event.currentTarget.checked)}
          color="indigo"
        />
        <Button
          className="button button-primary"
          type="submit"
          disabled={isFormDisabled}
          loading={isSubmitting}
          leftSection={<Icon name="sparkle" size={16} />}
        >
          {isSubmitting ? "Generating note…" : "Create study note"}
        </Button>
      </Box>
    </Box>
  );
}
