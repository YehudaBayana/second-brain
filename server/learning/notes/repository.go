package notes

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (repository *Repository) ListNotes(ctx context.Context, userID uuid.UUID) ([]note, error) {
	rows, err := repository.db.Query(ctx, `
		SELECT n.id, n.topic_id, t.name, n.title, n.question_asked, n.source_text,
		       n.ai_explanation, n.key_takeaways, n.code_examples, n.source_url, n.created_at
		FROM notes n
		JOIN topics t ON t.id = n.topic_id
		WHERE n.user_id = $1
		ORDER BY n.created_at DESC
		LIMIT 100`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanNotes(rows)
}

func (repository *Repository) GetNote(ctx context.Context, userID, noteID uuid.UUID) (note, error) {
	var item note
	var takeaways, examples []byte
	err := repository.db.QueryRow(ctx, `
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

func (repository *Repository) ListNoteFlashcards(ctx context.Context, userID, noteID uuid.UUID) ([]flashcard, error) {
	rows, err := repository.db.Query(ctx, `
		SELECT f.id, f.note_id, t.name, n.title, f.front_question, f.back_answer,
		       f.memory_level, f.next_review_date::text
		FROM flashcards f
		JOIN notes n ON n.id = f.note_id
		JOIN topics t ON t.id = f.topic_id
		WHERE f.note_id = $1 AND n.user_id = $2
		ORDER BY f.next_review_date, f.id`, noteID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanFlashcards(rows)
}

func (repository *Repository) GetTopicName(ctx context.Context, userID, topicID uuid.UUID) (string, error) {
	var name string
	err := repository.db.QueryRow(ctx,
		`SELECT name FROM topics WHERE id = $1 AND user_id = $2`, topicID, userID,
	).Scan(&name)
	return name, err
}

func (repository *Repository) UpdateNoteFromChat(
	ctx context.Context,
	userID, noteID uuid.UUID,
	reply generatedNoteChat,
	embedding string,
) (note, error) {
	takeawaysJSON, err := json.Marshal(reply.KeyTakeaways)
	if err != nil {
		return note{}, err
	}
	examplesJSON, err := json.Marshal(reply.CodeExamples)
	if err != nil {
		return note{}, err
	}

	var item note
	var takeaways, examples []byte
	err = repository.db.QueryRow(ctx, `
		UPDATE notes
		SET title = $1, ai_explanation = $2, key_takeaways = $3::jsonb,
		    code_examples = $4::jsonb, embedding = $5::vector
		WHERE id = $6 AND user_id = $7
		RETURNING title, ai_explanation, key_takeaways, code_examples`,
		reply.Title, reply.Explanation, string(takeawaysJSON), string(examplesJSON), embedding,
		noteID, userID,
	).Scan(&item.Title, &item.Explanation, &takeaways, &examples)
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

func (repository *Repository) CreateNote(
	ctx context.Context,
	userID, topicID uuid.UUID,
	topicName string,
	input createNoteRequest,
	lesson generatedLesson,
	embedding string,
) (note, []flashcard, error) {
	tx, err := repository.db.Begin(ctx)
	if err != nil {
		return note{}, nil, err
	}
	defer tx.Rollback(ctx)

	var saved note
	var sourceURL *string
	if input.SourceURL != "" {
		sourceURL = &input.SourceURL
	}
	takeawaysJSON, err := json.Marshal(lesson.KeyTakeaways)
	if err != nil {
		return note{}, nil, err
	}
	examplesJSON, err := json.Marshal(lesson.CodeExamples)
	if err != nil {
		return note{}, nil, err
	}
	err = tx.QueryRow(ctx, `
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
		return note{}, nil, err
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
			err := tx.QueryRow(ctx, `
				INSERT INTO flashcards (note_id, topic_id, front_question, back_answer, next_review_date)
				VALUES ($1, $2, $3, $4, CURRENT_DATE + 1)
				RETURNING id, memory_level, next_review_date::text`,
				saved.ID, topicID, generated.Front, generated.Back,
			).Scan(&card.ID, &card.MemoryLevel, &card.NextReviewDate)
			if err != nil {
				return note{}, nil, fmt.Errorf("%w: %v", errSaveQuizCards, err)
			}
			card.NoteID = saved.ID
			card.TopicName = topicName
			card.NoteTitle = lesson.Title
			card.FrontQuestion = generated.Front
			card.BackAnswer = generated.Back
			savedCards = append(savedCards, card)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return note{}, nil, err
	}
	return saved, savedCards, nil
}

func (repository *Repository) FindRelatedNotes(
	ctx context.Context,
	userID, excludeID uuid.UUID,
	embedding string,
) ([]map[string]any, error) {
	rows, err := repository.db.Query(ctx, `
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

func scanNotes(rows pgx.Rows) ([]note, error) {
	notes := make([]note, 0)
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
		notes = append(notes, item)
	}
	return notes, rows.Err()
}

func scanFlashcards(rows pgx.Rows) ([]flashcard, error) {
	cards := make([]flashcard, 0)
	for rows.Next() {
		var card flashcard
		if err := rows.Scan(&card.ID, &card.NoteID, &card.TopicName, &card.NoteTitle,
			&card.FrontQuestion, &card.BackAnswer, &card.MemoryLevel, &card.NextReviewDate); err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}
	return cards, rows.Err()
}
