package notes

import (
	"context"
	"errors"
	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/learning/embedding"
	"github.com/YehudaBayana/second-brain/server/learning/httpapi"
	"github.com/YehudaBayana/second-brain/server/learning/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type note = models.Note

type noteDetail struct {
	Note  note               `json:"note"`
	Cards []models.Flashcard `json:"cards"`
}

type generatedLesson struct {
	Title        string   `json:"title"`
	Explanation  string   `json:"explanation"`
	KeyTakeaways []string `json:"key_takeaways"`
	CodeExamples []string `json:"code_examples"`
	Flashcards   []aiCard `json:"flashcards"`
}

type aiCard struct {
	Front string `json:"front"`
	Back  string `json:"back"`
}

type createNoteRequest struct {
	TopicID    string `json:"topic_id"`
	Question   string `json:"question"`
	SourceText string `json:"source_text"`
	SourceURL  string `json:"source_url"`
	SaveToDeck bool   `json:"save_to_deck"`
}

type noteChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type noteChatRequest struct {
	Message string            `json:"message"`
	History []noteChatMessage `json:"history"`
}

type noteChatResponse struct {
	Answer  string `json:"answer"`
	Note    note   `json:"note"`
	Updated bool   `json:"updated"`
}

func (api *API) HandleNotes(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		notes, err := api.repository.ListNotes(r.Context(), userID)
		if err != nil {
			log.Printf("Load notes: %v", err)
			httpapi.WriteError(w, http.StatusInternalServerError, "could not load notes")
			return
		}
		httpapi.WriteJSON(w, http.StatusOK, notes)
	case http.MethodPost:
		api.handleCreateNote(w, r, userID)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (api *API) HandleNote(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	noteID, err := uuid.Parse(r.PathValue("noteID"))
	if err != nil {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "invalid note id")
		return
	}
	item, err := api.repository.GetNote(r.Context(), userID, noteID)
	if errors.Is(err, pgx.ErrNoRows) {
		httpapi.WriteError(w, http.StatusNotFound, "note not found")
		return
	}
	if err != nil {
		log.Printf("Load note: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	cards, err := api.repository.ListNoteFlashcards(r.Context(), userID, noteID)
	if err != nil {
		log.Printf("Load note flashcards: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	httpapi.WriteJSON(w, http.StatusOK, noteDetail{Note: item, Cards: cards})
}

func (api *API) HandleNoteChat(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	noteID, err := uuid.Parse(r.PathValue("noteID"))
	if err != nil {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "invalid note id")
		return
	}
	var input noteChatRequest
	if !httpapi.DecodeJSON(w, r, &input) {
		return
	}
	input.Message = strings.TrimSpace(input.Message)
	if input.Message == "" || len(input.Message) > maxChatMessage {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "message must be between 1 and 2,000 characters")
		return
	}
	if len(input.History) > 20 {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "chat history is too long")
		return
	}
	for _, message := range input.History {
		if (message.Role != "user" && message.Role != "assistant") || len(message.Content) > maxChatMessage {
			httpapi.WriteError(w, http.StatusUnprocessableEntity, "invalid chat history")
			return
		}
	}

	item, err := api.repository.GetNote(r.Context(), userID, noteID)
	if errors.Is(err, pgx.ErrNoRows) {
		httpapi.WriteError(w, http.StatusNotFound, "note not found")
		return
	}
	if err != nil {
		log.Printf("Load note for chat: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not load note")
		return
	}

	generationContext, cancelGeneration := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancelGeneration()
	reply, err := generateNoteChat(generationContext, api.ai, item, input.History, input.Message)
	if err != nil {
		log.Printf("Generate note chat response: %v", err)
		if api.ai == nil {
			httpapi.WriteError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		httpapi.WriteError(w, http.StatusBadGateway, "AI could not answer; please try again")
		return
	}

	if reply.UpdateNote {
		embeddingText := strings.Join([]string{
			item.Title, item.Question, item.SourceText, reply.Title, reply.Explanation,
			strings.Join(reply.KeyTakeaways, "\n"), strings.Join(reply.CodeExamples, "\n"),
		}, "\n")
		embeddingContext, cancelEmbedding := context.WithTimeout(r.Context(), 30*time.Second)
		defer cancelEmbedding()
		embeddingValue, err := embedding.EmbedText(embeddingContext, api.ai, embeddingText)
		if err != nil {
			log.Printf("Embed updated note: %v", err)
			httpapi.WriteError(w, http.StatusBadGateway, "AI could not update note search; please try again")
			return
		}
		updated, err := api.repository.UpdateNoteFromChat(r.Context(), userID, noteID, reply, embeddingValue)
		if err != nil {
			log.Printf("Update note from chat: %v", err)
			httpapi.WriteError(w, http.StatusInternalServerError, "could not update note")
			return
		}
		item.Title = updated.Title
		item.Explanation = updated.Explanation
		item.KeyTakeaways = updated.KeyTakeaways
		item.CodeExamples = updated.CodeExamples
	}

	httpapi.WriteJSON(w, http.StatusOK, noteChatResponse{
		Answer:  reply.Answer,
		Note:    item,
		Updated: reply.UpdateNote,
	})
}

func (api *API) handleCreateNote(w http.ResponseWriter, r *http.Request, userID uuid.UUID) {
	var input createNoteRequest
	if !httpapi.DecodeJSON(w, r, &input) {
		return
	}

	input.Question = strings.TrimSpace(input.Question)
	input.SourceText = strings.TrimSpace(input.SourceText)
	input.SourceURL = strings.TrimSpace(input.SourceURL)
	if input.Question == "" || len(input.Question) > maxQuestionLength {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "add a question or topic (up to 500 characters)")
		return
	}
	if len(input.SourceText) > maxSourceText {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "source text must be 30,000 characters or fewer")
		return
	}
	if len(input.SourceURL) > maxSourceURL || !validSourceURL(input.SourceURL) {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "source URL must be a valid http or https address")
		return
	}
	topicID, err := uuid.Parse(input.TopicID)
	if err != nil {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "choose a valid topic")
		return
	}
	topicName, err := api.repository.GetTopicName(r.Context(), userID, topicID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpapi.WriteError(w, http.StatusUnprocessableEntity, "choose one of your topics")
			return
		}
		log.Printf("Check note topic: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not create note")
		return
	}

	generationContext, cancelGeneration := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancelGeneration()
	lesson, err := generateLesson(generationContext, api.ai, input.Question, input.SourceText)
	if err != nil {
		log.Printf("Generate lesson: %v", err)
		if api.ai == nil {
			httpapi.WriteError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		httpapi.WriteError(w, http.StatusBadGateway, "AI could not create the lesson; please try again")
		return
	}

	embeddingText := strings.Join([]string{
		lesson.Title,
		input.Question,
		input.SourceText,
		lesson.Explanation,
		strings.Join(lesson.KeyTakeaways, "\n"),
	}, "\n")
	embeddingContext, cancelEmbedding := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancelEmbedding()
	embeddingValue, err := embedding.EmbedText(embeddingContext, api.ai, embeddingText)
	if err != nil {
		log.Printf("Embed note: %v", err)
		if api.ai == nil {
			httpapi.WriteError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		httpapi.WriteError(w, http.StatusBadGateway, "AI could not prepare note search; please try again")
		return
	}

	related, err := api.repository.FindRelatedNotes(r.Context(), userID, uuid.Nil, embeddingValue)
	if err != nil {
		log.Printf("Find related notes: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not find related notes")
		return
	}

	saved, savedCards, err := api.repository.CreateNote(r.Context(), userID, topicID, topicName, input, lesson, embeddingValue)
	if err != nil {
		log.Printf("Save note: %v", err)
		if errors.Is(err, errSaveQuizCards) {
			httpapi.WriteError(w, http.StatusInternalServerError, "could not save quiz cards")
			return
		}
		httpapi.WriteError(w, http.StatusInternalServerError, "could not save note")
		return
	}

	httpapi.WriteJSON(w, http.StatusCreated, map[string]any{
		"note": saved, "title": lesson.Title, "cards": savedCards,
		"relatedNotes": related,
	})
}

func validSourceURL(raw string) bool {
	if raw == "" {
		return true
	}
	parsed, err := url.ParseRequestURI(raw)
	return err == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != ""
}
