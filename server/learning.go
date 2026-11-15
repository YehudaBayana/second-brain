package main

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

type LearningAPI struct {
	db *pgxpool.Pool
	ai *genai.Client
}

func NewLearningAPI(db *pgxpool.Pool, ai *genai.Client) *LearningAPI {
	return &LearningAPI{db: db, ai: ai}
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

func (api *LearningAPI) HandleTopics(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if err := api.ensureDefaultTopics(r.Context(), userID); err != nil {
			log.Printf("Create default topics: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load topics")
			return
		}
		rows, err := api.db.Query(r.Context(),
			`SELECT id, name FROM topics WHERE user_id = $1 ORDER BY name`, userID)
		if err != nil {
			log.Printf("Load topics: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load topics")
			return
		}
		defer rows.Close()
		topics := make([]topic, 0)
		for rows.Next() {
			var item topic
			if err := rows.Scan(&item.ID, &item.Name); err != nil {
				log.Printf("Read topic: %v", err)
				writeLearningError(w, http.StatusInternalServerError, "could not load topics")
				return
			}
			topics = append(topics, item)
		}
		if err := rows.Err(); err != nil {
			log.Printf("Iterate topics: %v", err)
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
		var item topic
		err := api.db.QueryRow(r.Context(),
			`INSERT INTO topics (user_id, name) VALUES ($1, $2) RETURNING id, name`,
			userID, name,
		).Scan(&item.ID, &item.Name)
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

func (api *LearningAPI) HandleNotes(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		rows, err := api.db.Query(r.Context(), `
			SELECT n.id, n.topic_id, t.name, n.title, n.question_asked, n.source_text,
			       n.ai_explanation, n.key_takeaways, n.code_examples, n.source_url, n.created_at
			FROM notes n
			JOIN topics t ON t.id = n.topic_id
			WHERE n.user_id = $1
			ORDER BY n.created_at DESC
			LIMIT 100`, userID)
		if err != nil {
			log.Printf("Load notes: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load notes")
			return
		}
		defer rows.Close()
		notes := make([]note, 0)
		for rows.Next() {
			var item note
			var takeaways, examples []byte
			if err := rows.Scan(&item.ID, &item.TopicID, &item.TopicName, &item.Title, &item.Question,
				&item.SourceText, &item.Explanation, &takeaways, &examples, &item.SourceURL, &item.CreatedAt); err != nil {
				log.Printf("Read note: %v", err)
				writeLearningError(w, http.StatusInternalServerError, "could not load notes")
				return
			}
			if err := json.Unmarshal(takeaways, &item.KeyTakeaways); err != nil {
				log.Printf("Decode note takeaways: %v", err)
				writeLearningError(w, http.StatusInternalServerError, "could not load notes")
				return
			}
			if err := json.Unmarshal(examples, &item.CodeExamples); err != nil {
				log.Printf("Decode note code examples: %v", err)
				writeLearningError(w, http.StatusInternalServerError, "could not load notes")
				return
			}
			notes = append(notes, item)
		}
		if err := rows.Err(); err != nil {
			log.Printf("Iterate notes: %v", err)
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

func (api *LearningAPI) HandleNote(w http.ResponseWriter, r *http.Request) {
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
	item, err := api.loadNote(r.Context(), userID, noteID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeLearningError(w, http.StatusNotFound, "note not found")
		return
	}
	if err != nil {
		log.Printf("Load note: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	rows, err := api.db.Query(r.Context(), `
		SELECT f.id, f.note_id, t.name, n.title, f.front_question, f.back_answer,
		       f.memory_level, f.next_review_date::text
		FROM flashcards f
		JOIN notes n ON n.id = f.note_id
		JOIN topics t ON t.id = f.topic_id
		WHERE f.note_id = $1 AND n.user_id = $2
		ORDER BY f.next_review_date, f.id`, noteID, userID)
	if err != nil {
		log.Printf("Load note flashcards: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	defer rows.Close()
	cards := make([]flashcard, 0)
	for rows.Next() {
		var card flashcard
		if err := rows.Scan(&card.ID, &card.NoteID, &card.TopicName, &card.NoteTitle,
			&card.FrontQuestion, &card.BackAnswer, &card.MemoryLevel, &card.NextReviewDate); err != nil {
			log.Printf("Read note flashcard: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load note")
			return
		}
		cards = append(cards, card)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Iterate note flashcards: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load note")
		return
	}
	writeLearningJSON(w, http.StatusOK, noteDetail{Note: item, Cards: cards})
}

func (api *LearningAPI) HandleNoteChat(w http.ResponseWriter, r *http.Request) {
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

	item, err := api.loadNote(r.Context(), userID, noteID)
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
		takeawaysJSON, err := json.Marshal(reply.KeyTakeaways)
		if err != nil {
			log.Printf("Encode updated note takeaways: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not update note")
			return
		}
		examplesJSON, err := json.Marshal(reply.CodeExamples)
		if err != nil {
			log.Printf("Encode updated note examples: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not update note")
			return
		}
		err = api.db.QueryRow(r.Context(), `
			UPDATE notes
			SET title = $1, ai_explanation = $2, key_takeaways = $3::jsonb,
			    code_examples = $4::jsonb, embedding = $5::vector
			WHERE id = $6 AND user_id = $7
			RETURNING title, ai_explanation, key_takeaways, code_examples`,
			reply.Title, reply.Explanation, string(takeawaysJSON), string(examplesJSON), embedding,
			noteID, userID,
		).Scan(&item.Title, &item.Explanation, &takeawaysJSON, &examplesJSON)
		if err != nil {
			log.Printf("Update note from chat: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not update note")
			return
		}
		if err := json.Unmarshal(takeawaysJSON, &item.KeyTakeaways); err != nil {
			log.Printf("Read updated note takeaways: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not update note")
			return
		}
		if err := json.Unmarshal(examplesJSON, &item.CodeExamples); err != nil {
			log.Printf("Read updated note examples: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not update note")
			return
		}
	}

	writeLearningJSON(w, http.StatusOK, noteChatResponse{
		Answer:  reply.Answer,
		Note:    item,
		Updated: reply.UpdateNote,
	})
}

func (api *LearningAPI) loadNote(ctx context.Context, userID, noteID uuid.UUID) (note, error) {
	var item note
	var takeaways, examples []byte
	err := api.db.QueryRow(ctx, `
		SELECT n.id, n.topic_id, t.name, n.title, n.question_asked, n.source_text,
		       n.ai_explanation, n.key_takeaways, n.code_examples, n.source_url, n.created_at
		FROM notes n
		JOIN topics t ON t.id = n.topic_id
		WHERE n.id = $1 AND n.user_id = $2`, noteID, userID,
	).Scan(&item.ID, &item.TopicID, &item.TopicName, &item.Title, &item.Question,
		&item.SourceText, &item.Explanation, &takeaways, &examples, &item.SourceURL, &item.CreatedAt)
	if err != nil {
		return note{}, err
	}
	if err := json.Unmarshal(takeaways, &item.KeyTakeaways); err != nil {
		return note{}, err
	}
	if err := json.Unmarshal(examples, &item.CodeExamples); err != nil {
		return note{}, err
	}
	return item, nil
}

func (api *LearningAPI) handleCreateNote(w http.ResponseWriter, r *http.Request, userID uuid.UUID) {
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
	var topicName string
	if err := api.db.QueryRow(r.Context(),
		`SELECT name FROM topics WHERE id = $1 AND user_id = $2`, topicID, userID,
	).Scan(&topicName); err != nil {
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

	related, err := api.findRelatedNotes(r.Context(), userID, uuid.Nil, embedding)
	if err != nil {
		log.Printf("Find related notes: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not find related notes")
		return
	}

	tx, err := api.db.Begin(r.Context())
	if err != nil {
		log.Printf("Begin note transaction: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not save note")
		return
	}
	defer tx.Rollback(r.Context())

	var saved note
	var sourceURL *string
	if input.SourceURL != "" {
		sourceURL = &input.SourceURL
	}
	takeawaysJSON, err := json.Marshal(lesson.KeyTakeaways)
	if err != nil {
		log.Printf("Encode note takeaways: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not save note")
		return
	}
	examplesJSON, err := json.Marshal(lesson.CodeExamples)
	if err != nil {
		log.Printf("Encode note code examples: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not save note")
		return
	}
	err = tx.QueryRow(r.Context(), `
		INSERT INTO notes (
			user_id, topic_id, title, question_asked, source_text, ai_explanation,
			key_takeaways, code_examples, source_url, embedding
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10::vector)
		RETURNING id, created_at`,
		userID, topicID, lesson.Title, input.Question, input.SourceText, lesson.Explanation,
		string(takeawaysJSON), string(examplesJSON), sourceURL, embedding,
	).Scan(&saved.ID, &saved.CreatedAt)
	if err != nil {
		log.Printf("Insert note: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not save note")
		return
	}
	saved.TopicID = topicID
	saved.TopicName = topicName
	saved.Title = lesson.Title
	saved.Question = input.Question
	saved.SourceText = input.SourceText
	saved.Explanation = lesson.Explanation
	saved.KeyTakeaways = lesson.KeyTakeaways
	saved.CodeExamples = lesson.CodeExamples
	saved.SourceURL = sourceURL

	savedCards := make([]flashcard, 0)
	if input.SaveToDeck {
		for _, generated := range lesson.Flashcards {
			var card flashcard
			err := tx.QueryRow(r.Context(), `
				INSERT INTO flashcards (note_id, topic_id, front_question, back_answer, next_review_date)
				VALUES ($1, $2, $3, $4, CURRENT_DATE + 1)
				RETURNING id, memory_level, next_review_date::text`,
				saved.ID, topicID, generated.Front, generated.Back,
			).Scan(&card.ID, &card.MemoryLevel, &card.NextReviewDate)
			if err != nil {
				log.Printf("Insert flashcard: %v", err)
				writeLearningError(w, http.StatusInternalServerError, "could not save quiz cards")
				return
			}
			card.NoteID = saved.ID
			card.TopicName = topicName
			card.NoteTitle = lesson.Title
			card.FrontQuestion = generated.Front
			card.BackAnswer = generated.Back
			savedCards = append(savedCards, card)
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		log.Printf("Commit note transaction: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not save note")
		return
	}

	writeLearningJSON(w, http.StatusCreated, map[string]any{
		"note": saved, "title": lesson.Title, "cards": savedCards,
		"relatedNotes": related,
	})
}

func (api *LearningAPI) HandleSearch(w http.ResponseWriter, r *http.Request) {
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
	results, err := api.searchNotes(r.Context(), userID, query, embedding)
	if err != nil {
		log.Printf("Search notes: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not search notes")
		return
	}
	writeLearningJSON(w, http.StatusOK, results)
}

func (api *LearningAPI) HandleDueReviews(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	rows, err := api.db.Query(r.Context(), `
		SELECT f.id, f.note_id, t.name, n.title, f.front_question,
		       f.back_answer, f.memory_level, f.next_review_date::text
		FROM flashcards f
		JOIN notes n ON n.id = f.note_id
		JOIN topics t ON t.id = f.topic_id
		WHERE n.user_id = $1 AND f.next_review_date <= CURRENT_DATE
		ORDER BY f.next_review_date, f.memory_level, f.id`, userID)
	if err != nil {
		log.Printf("Load due reviews: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load review cards")
		return
	}
	defer rows.Close()
	cards := make([]flashcard, 0)
	for rows.Next() {
		var card flashcard
		if err := rows.Scan(&card.ID, &card.NoteID, &card.TopicName, &card.NoteTitle,
			&card.FrontQuestion, &card.BackAnswer, &card.MemoryLevel, &card.NextReviewDate); err != nil {
			log.Printf("Read review card: %v", err)
			writeLearningError(w, http.StatusInternalServerError, "could not load review cards")
			return
		}
		cards = append(cards, card)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Iterate review cards: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load review cards")
		return
	}
	writeLearningJSON(w, http.StatusOK, cards)
}

func (api *LearningAPI) HandleGradeReview(w http.ResponseWriter, r *http.Request) {
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
	tx, err := api.db.Begin(r.Context())
	if err != nil {
		log.Printf("Begin review transaction: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not update review card")
		return
	}
	defer tx.Rollback(r.Context())

	var level int
	err = tx.QueryRow(r.Context(), `
		SELECT f.memory_level
		FROM flashcards f
		JOIN notes n ON n.id = f.note_id
		WHERE f.id = $1 AND n.user_id = $2
		FOR UPDATE OF f`, cardID, userID).Scan(&level)
	if errors.Is(err, pgx.ErrNoRows) {
		writeLearningError(w, http.StatusNotFound, "review card not found")
		return
	}
	if err != nil {
		log.Printf("Load review card level: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not update review card")
		return
	}

	nextLevel := nextMemoryLevel(level, input.Grade)
	days := reviewIntervals[nextLevel-1]
	command, err := tx.Exec(r.Context(), `
		UPDATE flashcards f
		SET memory_level = $1, next_review_date = CURRENT_DATE + $2::int
		FROM notes n
		WHERE f.id = $3 AND n.id = f.note_id AND n.user_id = $4`,
		nextLevel, days, cardID, userID)
	if err != nil {
		log.Printf("Update review card: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not update review card")
		return
	}
	if command.RowsAffected() == 0 {
		writeLearningError(w, http.StatusNotFound, "review card not found")
		return
	}
	if err := tx.Commit(r.Context()); err != nil {
		log.Printf("Commit review transaction: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not update review card")
		return
	}
	writeLearningJSON(w, http.StatusOK, map[string]any{
		"memoryLevel":      nextLevel,
		"nextReviewInDays": days,
	})
}

func (api *LearningAPI) HandleStats(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		writeLearningError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	var stats struct {
		Notes      int `json:"notes"`
		Cards      int `json:"cards"`
		DueToday   int `json:"dueToday"`
		TopicCount int `json:"topics"`
	}
	err := api.db.QueryRow(r.Context(), `
		SELECT
			(SELECT count(*) FROM notes WHERE user_id = $1),
			(SELECT count(*) FROM flashcards f JOIN notes n ON n.id = f.note_id WHERE n.user_id = $1),
			(SELECT count(*) FROM flashcards f JOIN notes n ON n.id = f.note_id WHERE n.user_id = $1 AND f.next_review_date <= CURRENT_DATE),
			(SELECT count(*) FROM topics WHERE user_id = $1)`, userID,
	).Scan(&stats.Notes, &stats.Cards, &stats.DueToday, &stats.TopicCount)
	if err != nil {
		log.Printf("Load learning stats: %v", err)
		writeLearningError(w, http.StatusInternalServerError, "could not load dashboard")
		return
	}
	writeLearningJSON(w, http.StatusOK, stats)
}

func (api *LearningAPI) ensureDefaultTopics(ctx context.Context, userID uuid.UUID) error {
	for _, name := range []string{"Software", "Systems Design", "Web Development", "Other"} {
		if _, err := api.db.Exec(ctx, `
			INSERT INTO topics (user_id, name) VALUES ($1, $2)
			ON CONFLICT DO NOTHING`, userID, name); err != nil {
			return err
		}
	}
	return nil
}

func (api *LearningAPI) searchNotes(ctx context.Context, userID uuid.UUID, query, embedding string) ([]note, error) {
	rows, err := api.db.Query(ctx, `
		WITH vector_hits AS (
			SELECT id, row_number() OVER (ORDER BY embedding <=> $1::vector) AS rank
			FROM notes WHERE user_id = $2 ORDER BY embedding <=> $1::vector LIMIT 20
		),
		text_hits AS (
			SELECT id, row_number() OVER (
				ORDER BY ts_rank(
					to_tsvector('english', question_asked || ' ' || ai_explanation),
					plainto_tsquery('english', $3)
				) DESC
			) AS rank
			FROM notes
			WHERE user_id = $2 AND to_tsvector('english', question_asked || ' ' || ai_explanation)
				@@ plainto_tsquery('english', $3)
			LIMIT 20
		),
		ranks AS (
			SELECT COALESCE(v.id, t.id) AS id,
			       COALESCE(1.0 / (60 + v.rank), 0.0) + COALESCE(1.0 / (60 + t.rank), 0.0) AS score
			FROM vector_hits v FULL OUTER JOIN text_hits t ON t.id = v.id
		)
		SELECT n.id, n.topic_id, topics.name, n.title, n.question_asked, n.source_text,
		       n.ai_explanation, n.key_takeaways, n.code_examples, n.source_url, n.created_at
		FROM ranks JOIN notes n ON n.id = ranks.id
		JOIN topics ON topics.id = n.topic_id
		WHERE n.user_id = $2
		ORDER BY ranks.score DESC LIMIT 10`, embedding, userID, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	results := make([]note, 0)
	for rows.Next() {
		var item note
		var takeaways, examples []byte
		if err := rows.Scan(&item.ID, &item.TopicID, &item.TopicName, &item.Title, &item.Question,
			&item.SourceText, &item.Explanation, &takeaways, &examples, &item.SourceURL, &item.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(takeaways, &item.KeyTakeaways); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(examples, &item.CodeExamples); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, rows.Err()
}

func (api *LearningAPI) findRelatedNotes(ctx context.Context, userID, excludeID uuid.UUID, embedding string) ([]map[string]any, error) {
	rows, err := api.db.Query(ctx, `
		SELECT n.id, n.title, t.name, 1 - (n.embedding <=> $1::vector) AS similarity
		FROM notes n JOIN topics t ON t.id = n.topic_id
		WHERE n.user_id = $2 AND n.id <> $3
		ORDER BY n.embedding <=> $1::vector
		LIMIT 3`, embedding, userID, excludeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	type relatedNote struct {
		ID         uuid.UUID `json:"id"`
		Title      string    `json:"title"`
		TopicName  string    `json:"topicName"`
		Similarity float64   `json:"similarity"`
	}
	related := make([]relatedNote, 0)
	for rows.Next() {
		var item relatedNote
		if err := rows.Scan(&item.ID, &item.Title, &item.TopicName, &item.Similarity); err != nil {
			return nil, err
		}
		related = append(related, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	result := make([]map[string]any, len(related))
	for i, item := range related {
		result[i] = map[string]any{
			"id": item.ID, "title": item.Title,
			"topicName": item.TopicName, "similarity": item.Similarity,
		}
	}
	return result, nil
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
