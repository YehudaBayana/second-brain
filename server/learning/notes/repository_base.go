package notes

import (
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

var errSaveQuizCards = errors.New("save quiz cards")

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}
