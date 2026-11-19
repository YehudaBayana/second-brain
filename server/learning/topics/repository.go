package topics

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (repository *Repository) ListTopics(ctx context.Context, userID uuid.UUID) ([]topic, error) {
	for _, name := range []string{"Software", "Systems Design", "Web Development", "Other"} {
		if _, err := repository.db.Exec(ctx, `
			INSERT INTO topics (user_id, name) VALUES ($1, $2)
			ON CONFLICT DO NOTHING`, userID, name); err != nil {
			return nil, err
		}
	}

	rows, err := repository.db.Query(ctx,
		`SELECT id, name FROM topics WHERE user_id = $1 ORDER BY name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	topics := make([]topic, 0)
	for rows.Next() {
		var item topic
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		topics = append(topics, item)
	}
	return topics, rows.Err()
}

func (repository *Repository) CreateTopic(ctx context.Context, userID uuid.UUID, name string) (topic, error) {
	var item topic
	err := repository.db.QueryRow(ctx,
		`INSERT INTO topics (user_id, name) VALUES ($1, $2) RETURNING id, name`,
		userID, name,
	).Scan(&item.ID, &item.Name)
	return item, err
}
