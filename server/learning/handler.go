package learning

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/genai"
)

const (
	maxQuestionLength = 500
	maxSourceText     = 30000
	maxSourceURL      = 2048
	maxChatMessage    = 2000
)

var reviewIntervals = [...]int{1, 3, 7, 14, 30}

type API struct {
	repository *Repository
	ai         *genai.Client
}

func NewAPI(db *pgxpool.Pool, ai *genai.Client) *API {
	return &API{repository: NewRepository(db), ai: ai}
}

type topic struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type note struct {
	ID           uuid.UUID `json:"id"`
	TopicID      uuid.UUID `json:"topicId"`
	TopicName    string    `json:"topicName"`
	Title        string    `json:"title"`
	Question     string    `json:"question"`
	SourceText   string    `json:"sourceText"`
	Explanation  string    `json:"explanation"`
	KeyTakeaways []string  `json:"keyTakeaways"`
	CodeExamples []string  `json:"codeExamples"`
	SourceURL    *string   `json:"sourceUrl"`
	CreatedAt    time.Time `json:"createdAt"`
}

type noteDetail struct {
	Note  note        `json:"note"`
	Cards []flashcard `json:"cards"`
}

type flashcard struct {
	ID             uuid.UUID `json:"id"`
	NoteID         uuid.UUID `json:"noteId"`
	TopicName      string    `json:"topicName"`
	NoteTitle      string    `json:"noteTitle"`
	FrontQuestion  string    `json:"frontQuestion"`
	BackAnswer     string    `json:"backAnswer"`
	MemoryLevel    int       `json:"memoryLevel"`
	NextReviewDate string    `json:"nextReviewDate"`
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

func (api *API) HandleTopics(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		topics, err := api.repository.ListTopics(r.Context(), userID)
		if err != nil {
			log.Printf("Load topics: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load topics")
			return
		}
		writeLearningJSON(w, http.StatusOK, topics)
	case http.MethodPost:
		var input struct {
			Name string `json:"name"`
		}
		if !decodeLearningJSON(w, r, &input) {
			return
		}
		name := strings.TrimSpace(input.Name)
		if name == "" || len(name) > 60 {
			writeLearningError(w, http.StatusUnprocessableEntity, "topic name must be between 1 and 60 characters")
			return
		}
		item, err := api.repository.CreateTopic(r.Context(), userID, name)
		if err != nil {
			if isTopicConflict(err) {
				writeLearningError(w, http.StatusConflict, "you already have a topic with that name")
				return
			}
			log.Printf("Create topic: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not create topic")
			return
		}
		writeLearningJSON(w, http.StatusCreated, item)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (api *API) HandleNotes(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		notes, err := api.repository.ListNotes(r.Context(), userID)
		if err != nil {
			log.Printf("Load notes: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load notes")
			return
		}
		writeLearningJSON(w, http.StatusOK, notes)
	case http.MethodPost:
		api.handleCreateNote(w, r, userID)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (api *API) HandleNote(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	noteID, err := uuid.Parse(r.PathValue("noteID"))
	if err != nil {
		writeLearningError(w, http.StatusUnprocessableEntity, "invalid note id")
		return
	}
	item, err := api.repository.GetNote(r.Context(), userID, noteID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeLearningError(w, http.StatusNotFound, "note not found")
		return
	}
	if err != nil {
		log.Printf("Load note: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	cards, err := api.repository.ListNoteFlashcards(r.Context(), userID, noteID)
	if err != nil {
		log.Printf("Load note flashcards: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	writeLearningJSON(w, http.StatusOK, noteDetail{Note: item, Cards: cards})
}

func (api *API) HandleNoteChat(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	noteID, err := uuid.Parse(r.PathValue("noteID"))
	if err != nil {
		writeLearningError(w, http.StatusUnprocessableEntity, "invalid note id")
		return
	}
	var input noteChatRequest
	if !decodeLearningJSON(w, r, &input) {
		return
	}
	input.Message = strings.TrimSpace(input.Message)
	if input.Message == "" || len(input.Message) > maxChatMessage {
		writeLearningError(w, http.StatusUnprocessableEntity, "message must be between 1 and 2,000 characters")
		return
	}
	if len(input.History) > 20 {
		writeLearningError(w, http.StatusUnprocessableEntity, "chat history is too long")
		return
	}
	for _, message := range input.History {
		if (message.Role != "user" && message.Role != "assistant") || len(message.Content) > maxChatMessage {
			writeLearningError(w, http.StatusUnprocessableEntity, "invalid chat history")
			return
		}
	}

	item, err := api.repository.GetNote(r.Context(), userID, noteID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeLearningError(w, http.StatusNotFound, "note not found")
		return
	}
	if err != nil {
		log.Printf("Load note for chat: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load note")
		return
	}

	generationContext, cancelGeneration := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancelGeneration()
	reply, err := generateNoteChat(generationContext, api.ai, item, input.History, input.Message)
	if err != nil {
		log.Printf("Generate note chat response: %v", err)
		if api.ai == nil {
			writeLearningError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		writeLearningError(w, http.StatusBadGateway, "AI could not answer; please try again")
		return
	}

	if reply.UpdateNote {
		embeddingText := strings.Join([]string{
			item.Title, item.Question, item.SourceText, reply.Title, reply.Explanation,
			strings.Join(reply.KeyTakeaways, "\n"), strings.Join(reply.CodeExamples, "\n"),
		}, "\n")
		embeddingContext, cancelEmbedding := context.WithTimeout(r.Context(), 30*time.Second)
		defer cancelEmbedding()
		embedding, err := embedLearningText(embeddingContext, api.ai, embeddingText)
		if err != nil {
			log.Printf("Embed updated note: %v", err)
			writeLearningError(w, http.StatusBadGateway, "AI could not update note search; please try again")
			return
		}
		updated, err := api.repository.UpdateNoteFromChat(r.Context(), userID, noteID, reply, embedding)
		if err != nil {
			log.Printf("Update note from chat: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not update note")
			return
		}
		item.Title = updated.Title
		item.Explanation = updated.Explanation
		item.KeyTakeaways = updated.KeyTakeaways
		item.CodeExamples = updated.CodeExamples
	}

	writeLearningJSON(w, http.StatusOK, noteChatResponse{
		Answer:  reply.Answer,
		Note:    item,
		Updated: reply.UpdateNote,
	})
}

func (api *API) handleCreateNote(w http.ResponseWriter, r *http.Request, userID uuid.UUID) {
	var input createNoteRequest
	if !decodeLearningJSON(w, r, &input) {
		return
	}

	input.Question = strings.TrimSpace(input.Question)
	input.SourceText = strings.TrimSpace(input.SourceText)
	input.SourceURL = strings.TrimSpace(input.SourceURL)
	if input.Question == "" || len(input.Question) > maxQuestionLength {
		writeLearningError(w, http.StatusUnprocessableEntity, "add a question or topic (up to 500 characters)")
		return
	}
	if len(input.SourceText) > maxSourceText {
		writeLearningError(w, http.StatusUnprocessableEntity, "source text must be 30,000 characters or fewer")
		return
	}
	if len(input.SourceURL) > maxSourceURL || !validSourceURL(input.SourceURL) {
		writeLearningError(w, http.StatusUnprocessableEntity, "source URL must be a valid http or https address")
		return
	}
	topicID, err := uuid.Parse(input.TopicID)
	if err != nil {
		writeLearningError(w, http.StatusUnprocessableEntity, "choose a valid topic")
		return
	}
	topicName, err := api.repository.GetTopicName(r.Context(), userID, topicID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeLearningError(w, http.StatusUnprocessableEntity, "choose one of your topics")
			return
		}
		log.Printf("Check note topic: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not create note")
		return
	}

	generationContext, cancelGeneration := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancelGeneration()
	lesson, err := generateLesson(generationContext, api.ai, input.Question, input.SourceText)
	if err != nil {
		log.Printf("Generate lesson: %v", err)
		if api.ai == nil {
			writeLearningError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		writeLearningError(w, http.StatusBadGateway, "AI could not create the lesson; please try again")
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
	embedding, err := embedLearningText(embeddingContext, api.ai, embeddingText)
	if err != nil {
		log.Printf("Embed note: %v", err)
		if api.ai == nil {
			writeLearningError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		writeLearningError(w, http.StatusBadGateway, "AI could not prepare note search; please try again")
		return
	}

	related, err := api.repository.FindRelatedNotes(r.Context(), userID, uuid.Nil, embedding)
	if err != nil {
		log.Printf("Find related notes: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not find related notes")
		return
	}

	saved, savedCards, err := api.repository.CreateNote(r.Context(), userID, topicID, topicName, input, lesson, embedding)
	if err != nil {
		log.Printf("Save note: %v", err)
		if errors.Is(err, errSaveQuizCards) {
			writeLearningError(w, http.StatusInternalServerError, "could not save quiz cards")
			return
		}
		writeLearningError(w, http.StatusInternalServerError, "could not save note")
		return
	}

	writeLearningJSON(w, http.StatusCreated, map[string]any{
		"note": saved, "title": lesson.Title, "cards": savedCards,
		"relatedNotes": related,
	})
}

func (api *API) HandleSearch(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" || len(query) > 300 {
		writeLearningError(w, http.StatusUnprocessableEntity, "search must be between 1 and 300 characters")
		return
	}
	embeddingContext, cancelEmbedding := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancelEmbedding()
	embedding, err := embedLearningText(embeddingContext, api.ai, query)
	if err != nil {
		log.Printf("Embed search query: %v", err)
		if api.ai == nil {
			writeLearningError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		writeLearningError(w, http.StatusBadGateway, "semantic search is temporarily unavailable")
		return
	}
	results, err := api.repository.SearchNotes(r.Context(), userID, query, embedding)
	if err != nil {
		log.Printf("Search notes: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not search notes")
		return
	}
	writeLearningJSON(w, http.StatusOK, results)
}

func (api *API) HandleDueReviews(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	cards, err := api.repository.ListDueReviews(r.Context(), userID)
	if err != nil {
		log.Printf("Load due reviews: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load review cards")
		return
	}
	writeLearningJSON(w, http.StatusOK, cards)
}

func (api *API) HandleGradeReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	cardID, err := uuid.Parse(r.PathValue("cardID"))
	if err != nil {
		writeLearningError(w, http.StatusUnprocessableEntity, "invalid card id")
		return
	}
	var input struct {
		Grade string `json:"grade"`
	}
	if !decodeLearningJSON(w, r, &input) {
		return
	}
	if input.Grade != "forgot" && input.Grade != "got_it" && input.Grade != "too_easy" {
		writeLearningError(w, http.StatusUnprocessableEntity, "choose forgot, got_it, or too_easy")
		return
	}
	nextLevel, days, err := api.repository.GradeReview(r.Context(), userID, cardID, input.Grade)
	if errors.Is(err, pgx.ErrNoRows) {
		writeLearningError(w, http.StatusNotFound, "review card not found")
		return
	}
	if err != nil {
		log.Printf("Grade review card: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not update review card")
		return
	}
	writeLearningJSON(w, http.StatusOK, map[string]any{
		"memoryLevel":      nextLevel,
		"nextReviewInDays": days,
	})
}

func (api *API) HandleStats(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	stats, err := api.repository.LoadStats(r.Context(), userID)
	if err != nil {
		log.Printf("Load learning stats: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load dashboard")
		return
	}
	writeLearningJSON(w, http.StatusOK, stats)
}

func nextMemoryLevel(current int, grade string) int {
	if grade == "forgot" {
		return 1
	}
	increment := 1
	if grade == "too_easy" {
		increment = 2
	}
	if current+increment > 5 {
		return 5
	}
	return current + increment
}

func validSourceURL(raw string) bool {
	if raw == "" {
		return true
	}
	parsed, err := url.ParseRequestURI(raw)
	return err == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != ""
}

func isTopicConflict(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func decodeLearningJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	defer r.Body.Close()
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	if err := decoder.Decode(target); err != nil {
		writeLearningError(w, http.StatusBadRequest, "invalid request body")
		return false
	}
	return true
}

func writeLearningJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("Write API response: %v", err)
	}
}

func writeLearningError(w http.ResponseWriter, status int, message string) {
	writeLearningJSON(w, status, map[string]any{
		"error": map[string]string{"message": message},
	})
}

func vectorString(values []float32) (string, error) {
	if len(values) != 1536 {
		return "", fmt.Errorf("expected 1536 embedding dimensions, got %d", len(values))
	}
	var result strings.Builder
	result.WriteByte('[')
	for i, value := range values {
		if i > 0 {
			result.WriteByte(',')
		}
		result.WriteString(strconv.FormatFloat(float64(value), 'f', -1, 32))
	}
	result.WriteByte(']')
	return result.String(), nil
}
