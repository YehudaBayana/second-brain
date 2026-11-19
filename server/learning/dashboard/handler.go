package dashboard

import (
	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/learning/httpapi"
	"log"
	"net/http"
)

func (api *API) HandleStats(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	stats, err := api.repository.LoadStats(r.Context(), userID)
	if err != nil {
		log.Printf("Load learning stats: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not load dashboard")
		return
	}
	httpapi.WriteJSON(w, http.StatusOK, stats)
}
