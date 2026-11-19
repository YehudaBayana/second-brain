package notes

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/genai"
)

type API struct {
	repository *Repository
	ai         *genai.Client
}

func NewAPI(db *pgxpool.Pool, ai *genai.Client) *API {
	return &API{repository: NewRepository(db), ai: ai}
}
