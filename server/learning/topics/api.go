package topics

import "github.com/jackc/pgx/v5/pgxpool"

type API struct {
	repository *Repository
}

func NewAPI(db *pgxpool.Pool) *API {
	return &API{repository: NewRepository(db)}
}
