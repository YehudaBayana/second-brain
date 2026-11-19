package notes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/YehudaBayana/second-brain/server/config"
	"github.com/YehudaBayana/second-brain/server/learning/models"
	"google.golang.org/genai"
)

func generateLesson(ctx context.Context, client *genai.Client, question, sourceText string) (generatedLesson, error) {
	if client == nil {
		return generatedLesson{}, errors.New("Gemini client is not configured")
	}
	prompt := fmt.Sprintf(`Teach the learner about the question below using the provided notes as context.
Return a concise, accurate lesson, optional key takeaways and code examples when they add value, and 1-3 useful recall questions.
Omit key_takeaways or code_examples entirely when there is no useful content for that section.
For shell command examples, use plain multi-line Bash scripts without markdown fences; do not chain related commands onto one line.
Do not invent details that are absent from the source; clearly distinguish general background knowledge from source claims.

Question:
%s

Source notes (may be empty):
%s`, question, sourceText)

	// this fetch the exact live list of models enabled for my API key
	// models,err := client.Models.List(ctx, &genai.ListModelsConfig{});

	stringSchema := &genai.Schema{Type: genai.TypeString}
	result, err := generateContentWithFallback(ctx, client, []*genai.Content{
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
			Required: []string{"title", "explanation", "flashcards"},
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
	KeyTakeaways []string `json:"key_takeaways,omitempty"`
	CodeExamples []string `json:"code_examples,omitempty"`
}

func generateNoteChat(ctx context.Context, client *genai.Client, item models.Note, history []noteChatMessage, message string) (generatedNoteChat, error) {
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
When update_note is true, return the complete revised note fields. Preserve existing useful content and do not invent facts. Include key_takeaways and code_examples only when they contain useful content; otherwise omit those fields. For shell command examples, use plain multi-line Bash scripts without markdown fences. When false, return the current note fields unchanged.

Saved note:
%s

Recent conversation (JSON):
%s

Latest user message:
%s`, noteJSON, historyJSON, message)
	stringSchema := &genai.Schema{Type: genai.TypeString}
	result, err := generateContentWithFallback(ctx, client, []*genai.Content{
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
			Required: []string{"answer", "update_note", "title", "explanation"},
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
		(reply.Title == "" || reply.Explanation == "")) {
		return generatedNoteChat{}, errors.New("Gemini response is missing required chat content")
	}
	return reply, nil
}

func generateContentWithFallback(ctx context.Context, client *genai.Client, contents []*genai.Content, generationConfig *genai.GenerateContentConfig) (*genai.GenerateContentResponse, error) {
	var lastErr error
	for _, model := range config.GeminiGenerationModels() {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		attemptContext, cancel := context.WithTimeout(ctx, config.GeminiGenerationAttemptTimeout)
		result, err := client.Models.GenerateContent(attemptContext, model, contents, generationConfig)
		cancel()
		if err == nil {
			return result, nil
		}
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		if !isTransientGenerationError(err) {
			return nil, err
		}
		log.Printf("Gemini GenerateContent failed for model %q; trying fallback if available: %v", model, err)
		lastErr = err
	}
	return nil, lastErr
}

func isTransientGenerationError(err error) bool {
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}
	message := strings.ToUpper(err.Error())
	return strings.Contains(message, "503") ||
		strings.Contains(message, "UNAVAILABLE") ||
		strings.Contains(message, "504") ||
		strings.Contains(message, "DEADLINE_EXCEEDED")
}
