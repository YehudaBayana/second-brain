package reviews

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (repository *Repository) ListDueReviews(ctx context.Context, userID uuid.UUID) ([]flashcard, error) {
	rows, err := repository.db.Query(ctx, `
		SELECT f.id, f.note_id, t.name, n.title, f.front_question,
		       f.back_answer, f.memory_level, f.next_review_date::text
		FROM flashcards f
		JOIN notes n ON n.id = f.note_id
		JOIN topics t ON t.id = f.topic_id
		WHERE n.user_id = $1 AND f.next_review_date <= CURRENT_DATE
		ORDER BY f.next_review_date, f.memory_level, f.id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanFlashcards(rows)
}

func (repository *Repository) GradeReview(ctx context.Context, userID, cardID uuid.UUID, grade string) (int, int, error) {
	tx, err := repository.db.Begin(ctx)
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback(ctx)

	var level int
	err = tx.QueryRow(ctx, `
		SELECT f.memory_level
		FROM flashcards f
		JOIN notes n ON n.id = f.note_id
		WHERE f.id = $1 AND n.user_id = $2
		FOR UPDATE OF f`, cardID, userID).Scan(&level)
	if err != nil {
		return 0, 0, err
	}

	nextLevel := nextMemoryLevel(level, grade)
	days := reviewIntervals[nextLevel-1]
	command, err := tx.Exec(ctx, `
		UPDATE flashcards f
		SET memory_level = $1, next_review_date = CURRENT_DATE + $2::int
		FROM notes n
		WHERE f.id = $3 AND n.id = f.note_id AND n.user_id = $4`,
		nextLevel, days, cardID, userID)
	if err != nil {
		return 0, 0, err
	}
	if command.RowsAffected() == 0 {
		return 0, 0, pgx.ErrNoRows
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, 0, err
	}
	return nextLevel, days, nil
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
