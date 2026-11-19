package search

import (
	"context"
	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/learning/embedding"
	"github.com/YehudaBayana/second-brain/server/learning/httpapi"
	"log"
	"net/http"
	"strings"
	"time"
)

func (api *API) HandleSearch(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFrom(r.Context())
	if !ok {
		httpapi.WriteError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" || len(query) > 300 {
		httpapi.WriteError(w, http.StatusUnprocessableEntity, "search must be between 1 and 300 characters")
		return
	}
	embeddingContext, cancelEmbedding := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancelEmbedding()
	embeddingValue, err := embedding.EmbedText(embeddingContext, api.ai, query)
	if err != nil {
		log.Printf("Embed search query: %v", err)
		if api.ai == nil {
			httpapi.WriteError(w, http.StatusServiceUnavailable, "AI is not configured; set GEMINI_API_KEY and restart the API")
			return
		}
		httpapi.WriteError(w, http.StatusBadGateway, "semantic search is temporarily unavailable")
		return
	}
	results, err := api.repository.SearchNotes(r.Context(), userID, query, embeddingValue)
	if err != nil {
		log.Printf("Search notes: %v", err)
		httpapi.WriteError(w, http.StatusInternalServerError, "could not search notes")
		return
	}
	httpapi.WriteJSON(w, http.StatusOK, results)
}
