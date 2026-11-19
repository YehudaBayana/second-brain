package learning

import (
	"github.com/YehudaBayana/second-brain/server/learning/dashboard"
	"github.com/YehudaBayana/second-brain/server/learning/notes"
	"github.com/YehudaBayana/second-brain/server/learning/reviews"
	"github.com/YehudaBayana/second-brain/server/learning/search"
	"github.com/YehudaBayana/second-brain/server/learning/topics"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/genai"
)

type API struct {
	topics    *topics.API
	notes     *notes.API
	search    *search.API
	reviews   *reviews.API
	dashboard *dashboard.API
}

func NewAPI(db *pgxpool.Pool, ai *genai.Client) *API {
	return &API{
		topics:    topics.NewAPI(db),
		notes:     notes.NewAPI(db, ai),
		search:    search.NewAPI(db, ai),
		reviews:   reviews.NewAPI(db),
		dashboard: dashboard.NewAPI(db),
	}
}
