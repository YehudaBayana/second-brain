package learning

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

type generatedNoteChat struct {
	Answer       string   `json:"answer"`
	UpdateNote   bool     `json:"update_note"`
	Title        string   `json:"title"`
	Explanation  string   `json:"explanation"`
	KeyTakeaways []string `json:"key_takeaways"`
	CodeExamples []string `json:"code_examples"`
}

func generateNoteChat(ctx context.Context, client *genai.Client, item note, history []noteChatMessage, message string) (generatedNoteChat, error) {
	if client == nil {
		return generatedNoteChat{}, errors.New("Gemini client is not configured")
	}
	noteJSON, err := json.Marshal(map[string]any{
		"title": item.Title, "question": item.Question, "source_text": item.SourceText,
		"explanation": item.Explanation, "key_takeaways": item.KeyTakeaways,
		"code_examples": item.CodeExamples,
	})
	if err != nil {
		return generatedNoteChat{}, fmt.Errorf("encode note context: %w", err)
	}
	historyJSON, err := json.Marshal(history)
	if err != nil {
		return generatedNoteChat{}, fmt.Errorf("encode chat history: %w", err)
	}
	prompt := fmt.Sprintf(`You are a study assistant continuing a conversation about one saved note.
Answer the user's latest message using the note and conversation as context. Be accurate and concise.
Set update_note to true only when the discussion establishes useful, accurate content that should be added or corrected in the saved note. Otherwise set it to false.
When update_note is true, return the complete revised note fields. Preserve existing useful content and do not invent facts. When false, return the current note fields unchanged.

Saved note:
%s

Recent conversation (JSON):
%s

Latest user message:
%s`, noteJSON, historyJSON, message)
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
				"answer":        stringSchema,
				"update_note":   {Type: genai.TypeBoolean},
				"title":         stringSchema,
				"explanation":   stringSchema,
				"key_takeaways": {Type: genai.TypeArray, Items: stringSchema},
				"code_examples": {Type: genai.TypeArray, Items: stringSchema},
			},
			Required: []string{"answer", "update_note", "title", "explanation", "key_takeaways", "code_examples"},
		},
	})
	if err != nil {
		return generatedNoteChat{}, err
	}
	if result == nil {
		return generatedNoteChat{}, errors.New("Gemini returned an empty response")
	}
	var reply generatedNoteChat
	if err := json.Unmarshal([]byte(result.Text()), &reply); err != nil {
		return generatedNoteChat{}, fmt.Errorf("decode Gemini chat response: %w", err)
	}
	reply.Answer = strings.TrimSpace(reply.Answer)
	reply.Title = strings.TrimSpace(reply.Title)
	reply.Explanation = strings.TrimSpace(reply.Explanation)
	if reply.Answer == "" || (reply.UpdateNote &&
		(reply.Title == "" || reply.Explanation == "" || reply.KeyTakeaways == nil || reply.CodeExamples == nil)) {
		return generatedNoteChat{}, errors.New("Gemini response is missing required chat content")
	}
	return reply, nil
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
