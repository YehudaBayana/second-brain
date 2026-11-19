package reviews

import (
	"errors"

	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/learning/httpapi"
	"github.com/YehudaBayana/second-brain/server/learning/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"log"
	"net/http"
)

var reviewIntervals = [...]int{1, 3, 7, 14, 30}

type flashcard = models.Flashcard

func (api *API) HandleDueReviews(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	cards, err := api.repository.ListDueReviews(r.Context(), userID)
	if err != nil {
		log.Printf("Load due reviews: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not load review cards")
		return
	}
	httpapi.WriteJSON(w, http.StatusOK, cards)
}

func (api *API) HandleGradeReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	cardID, err := uuid.Parse(r.PathValue("cardID"))
	if err != nil {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "invalid card id")
		return
	}
	var input struct {
		Grade string `json:"grade"`
	}
	if !httpapi.DecodeJSON(w, r, &input) {
		return
	}
	if input.Grade != "forgot" && input.Grade != "got_it" && input.Grade != "too_easy" {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "choose forgot, got_it, or too_easy")
		return
	}
	nextLevel, days, err := api.repository.GradeReview(r.Context(), userID, cardID, input.Grade)
	if errors.Is(err, pgx.ErrNoRows) {
		httpapi.WriteError(w, http.StatusNotFound, "review card not found")
		return
	}
	if err != nil {
		log.Printf("Grade review card: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not update review card")
		return
	}
	httpapi.WriteJSON(w, http.StatusOK, map[string]any{
		"memoryLevel":      nextLevel,
		"nextReviewInDays": days,
	})
}

func nextMemoryLevel(current int, grade string) int {
	if grade == "forgot" {
		return 1
	}
	increment := 1
	if grade == "too_easy" {
		increment = 2
	}
	if current+increment > 5 {
		return 5
	}
	return current + increment
}
