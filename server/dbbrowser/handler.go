package dbbrowser

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// GetAllTables responds with sample rows and ordered columns for every table in the public schema.
func (h *Handler) GetAllTables(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err != nil || parsed < 1 || parsed > 100 {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "limit must be an integer between 1 and 100",
			})
			return
		}
		limit = parsed
	}

	previews, err := h.repo.ListTablePreviews(r.Context(), limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to fetch database tables",
		})
		return
	}

	writeJSON(w, http.StatusOK, previews)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
