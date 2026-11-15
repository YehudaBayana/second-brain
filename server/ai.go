package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"google.golang.org/genai"
)

func generateLesson(ctx context.Context, client *genai.Client, question, sourceText string) (generatedLesson, error) {
	if client == nil {
		return generatedLesson{}, errors.New("Gemini client is not configured")
	}
	prompt := fmt.Sprintf(`Teach the learner about the question below using the provided notes as context.
Return a concise, accurate lesson, 2-4 key takeaways, code examples only when relevant, and 1-3 useful recall questions.
Do not invent details that are absent from the source; clearly distinguish general background knowledge from source claims.

Question:
%s

Source notes (may be empty):
%s`, question, sourceText)

	stringSchema := &genai.Schema{Type: genai.TypeString}
	result, err := client.Models.GenerateContent(ctx, "gemini-3.5-flash", []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}, &genai.GenerateContentConfig{
		Temperature:      genai.Ptr[float32](0.3),
		MaxOutputTokens:  4096,
		ResponseMIMEType: "application/json",
		ResponseSchema: &genai.Schema{
			Type: genai.TypeObject,
			Properties: map[string]*genai.Schema{
				"title":         stringSchema,
				"explanation":   stringSchema,
				"key_takeaways": {Type: genai.TypeArray, Items: stringSchema},
				"code_examples": {Type: genai.TypeArray, Items: stringSchema},
				"flashcards": {
					Type: genai.TypeArray,
					Items: &genai.Schema{
						Type: genai.TypeObject,
						Properties: map[string]*genai.Schema{
							"front": stringSchema,
							"back":  stringSchema,
						},
						Required: []string{"front", "back"},
					},
				},
			},
			Required: []string{"title", "explanation", "key_takeaways", "code_examples", "flashcards"},
		},
	})
	if err != nil {
		return generatedLesson{}, err
	}
	if result == nil {
		return generatedLesson{}, errors.New("Gemini returned an empty response")
	}

	var lesson generatedLesson
	if err := json.Unmarshal([]byte(result.Text()), &lesson); err != nil {
		return generatedLesson{}, fmt.Errorf("decode Gemini response: %w", err)
	}
	lesson.Title = strings.TrimSpace(lesson.Title)
	lesson.Explanation = strings.TrimSpace(lesson.Explanation)
	if lesson.Title == "" || lesson.Explanation == "" || len(lesson.Flashcards) < 1 || len(lesson.Flashcards) > 3 {
		return generatedLesson{}, errors.New("Gemini response is missing required lesson content")
	}
	for i := range lesson.Flashcards {
		lesson.Flashcards[i].Front = strings.TrimSpace(lesson.Flashcards[i].Front)
		lesson.Flashcards[i].Back = strings.TrimSpace(lesson.Flashcards[i].Back)
		if lesson.Flashcards[i].Front == "" || lesson.Flashcards[i].Back == "" {
			return generatedLesson{}, errors.New("Gemini response contains an empty flashcard")
		}
	}
	return lesson, nil
}

func embedLearningText(ctx context.Context, client *genai.Client, content string) (string, error) {
	if client == nil {
		return "", errors.New("Gemini client is not configured")
	}
	const maxEmbeddingTextRunes = 8000
	runes := []rune(content)
	if len(runes) > maxEmbeddingTextRunes {
		content = string(runes[:maxEmbeddingTextRunes])
	}
	result, err := client.Models.EmbedContent(ctx, "gemini-embedding-2",
		[]*genai.Content{genai.NewContentFromText(content, genai.RoleUser)},
		&genai.EmbedContentConfig{OutputDimensionality: genai.Ptr[int32](1536)},
	)
	if err != nil {
		return "", err
	}
	if result == nil || len(result.Embeddings) == 0 {
		return "", errors.New("Gemini returned no embedding")
	}
	return vectorString(result.Embeddings[0].Values)
}
