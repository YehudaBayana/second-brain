package dashboard

import (
	"context"
	"github.com/YehudaBayana/second-brain/server/learning/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type learningStats = models.Stats

func (repository *Repository) LoadStats(ctx context.Context, userID uuid.UUID) (learningStats, error) {
	var stats learningStats
	err := repository.db.QueryRow(ctx, `
		SELECT
			(SELECT count(*) FROM notes WHERE user_id = $1),
			(SELECT count(*) FROM flashcards f JOIN notes n ON n.id = f.note_id WHERE n.user_id = $1),
			(SELECT count(*) FROM flashcards f JOIN notes n ON n.id = f.note_id WHERE n.user_id = $1 AND f.next_review_date <= CURRENT_DATE),
			(SELECT count(*) FROM topics WHERE user_id = $1)`, userID,
	).Scan(&stats.Notes, &stats.Cards, &stats.DueToday, &stats.TopicCount)
	return stats, err
}
