package topics

import (
	"errors"
	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/learning/httpapi"
	"github.com/YehudaBayana/second-brain/server/learning/models"
	"github.com/jackc/pgx/v5/pgconn"
	"log"
	"net/http"
	"strings"
)

type topic = models.Topic

func (api *API) HandleTopics(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		topics, err := api.repository.ListTopics(r.Context(), userID)
		if err != nil {
			log.Printf("Load topics: %v", err)
			httpapi.WriteError(w, http.StatusInternalServerError, "could not load topics")
			return
		}
		httpapi.WriteJSON(w, http.StatusOK, topics)
	case http.MethodPost:
		var input struct {
			Name string `json:"name"`
		}
		if !httpapi.DecodeJSON(w, r, &input) {
			return
		}
		name := strings.TrimSpace(input.Name)
		if name == "" || len(name) > 60 {
			httpapi.WriteError(w, http.StatusUnprocessableEntity, "topic name must be between 1 and 60 characters")
			return
		}
		item, err := api.repository.CreateTopic(r.Context(), userID, name)
		if err != nil {
			if isTopicConflict(err) {
				httpapi.WriteError(w, http.StatusConflict, "you already have a topic with that name")
				return
			}
			log.Printf("Create topic: %v", err)
			httpapi.WriteError(w, http.StatusInternalServerError, "could not create topic")
			return
		}
		httpapi.WriteJSON(w, http.StatusCreated, item)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func isTopicConflict(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
