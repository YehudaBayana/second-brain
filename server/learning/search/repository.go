package search

import (
	"context"
	"encoding/json"

	"github.com/YehudaBayana/second-brain/server/learning/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type note = models.Note

func (repository *Repository) SearchNotes(ctx context.Context, userID uuid.UUID, query, embedding string) ([]note, error) {
	rows, err := repository.db.Query(ctx, `
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
		SELECT n.id, n.topic_id, topics.name, n.title, n.question_asked,
		       n.ai_explanation, n.key_takeaways, n.code_examples, n.created_at
		FROM ranks JOIN notes n ON n.id = ranks.id
		JOIN topics ON topics.id = n.topic_id
		WHERE n.user_id = $2
		ORDER BY ranks.score DESC LIMIT 10`, embedding, userID, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanNotes(rows)
}

func scanNotes(rows pgx.Rows) ([]note, error) {
	items := make([]note, 0)
	for rows.Next() {
		var item note
		var takeaways, examples []byte
		if err := rows.Scan(&item.ID, &item.TopicID, &item.TopicName, &item.Title, &item.Question,
			&item.Explanation, &takeaways, &examples, &item.CreatedAt); err != nil {
			return nil, err
		}
		if len(takeaways) > 0 {
			if err := json.Unmarshal(takeaways, &item.KeyTakeaways); err != nil {
				return nil, err
			}
		}
		if len(examples) > 0 {
			if err := json.Unmarshal(examples, &item.CodeExamples); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
