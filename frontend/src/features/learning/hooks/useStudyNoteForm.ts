"use client";

import { useEffect, type FormEvent } from "react";
import { useTopics, useCreateNote } from "../query/useLearning";
import { useStudyNoteDraftStore } from "../store/useStudyNoteDraftStore";

/**
 * useStudyNoteForm
 * Custom hook encapsulating all form state, topic selection,
 * validation, mutation, and persistence for study notes.
 * Keeps React component files 100% free of local useState clutter.
 */
export function useStudyNoteForm() {
  const topicsQuery = useTopics();
  const createNoteMutation = useCreateNote();
  const topics = topicsQuery.data ?? [];
  const firstTopicId = topicsQuery.data?.[0]?.id;

  const {
    topicId,
    question,
    sourceText,
    sourceUrl,
    saveToDeck,
    createdNote,
    formError,
    setTopicId,
    setQuestion,
    setSourceText,
    setSourceUrl,
    setSaveToDeck,
    setCreatedNote,
    setFormError,
    resetForm,
  } = useStudyNoteDraftStore();

  const selectedTopicId = topicId || firstTopicId || "";

  useEffect(() => {
    if (!topicId && firstTopicId) {
      setTopicId(firstTopicId);
    }
  }, [topicId, firstTopicId, setTopicId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setCreatedNote(null);

    if (!question.trim()) {
      setFormError("Please enter a question or topic to study.");
      return false;
    }
    if (!selectedTopicId) {
      setFormError("Please select a topic.");
      return false;
    }

    try {
      const result = await createNoteMutation.mutateAsync({
        topic_id: selectedTopicId,
        question: question.trim(),
        source_text: sourceText.trim(),
        source_url: sourceUrl.trim(),
        save_to_deck: saveToDeck,
      });

      setCreatedNote(result);
      resetForm();
      return true;
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Could not create your study note.",
      );
      return false;
    }
  };

  return {
    topics,
    topicId: selectedTopicId,
    question,
    sourceText,
    sourceUrl,
    saveToDeck,
    createdNote,
    formError,
    isSubmitting: createNoteMutation.isPending,
    isLoadingTopics: topicsQuery.isPending,
    isFormDisabled:
      createNoteMutation.isPending ||
      topicsQuery.isPending ||
      !selectedTopicId,
    setTopicId,
    setQuestion,
    setSourceText,
    setSourceUrl,
    setSaveToDeck,
    clearError: () => setFormError(null),
    dismissCreatedNote: () => setCreatedNote(null),
    handleSubmit,
  };
}
