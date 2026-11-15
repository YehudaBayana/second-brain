package learning

import "net/http"

func (api *API) RegisterRoutes(
	mux *http.ServeMux,
	protected func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.Handle("GET /api/topics", protected(http.HandlerFunc(api.HandleTopics)))
	mux.Handle("POST /api/topics", protectedWrite(http.HandlerFunc(api.HandleTopics)))
	mux.Handle("GET /api/notes", protected(http.HandlerFunc(api.HandleNotes)))
	mux.Handle("POST /api/notes", protectedWrite(http.HandlerFunc(api.HandleNotes)))
	mux.Handle("GET /api/notes/{noteID}", protected(http.HandlerFunc(api.HandleNote)))
	mux.Handle("POST /api/notes/{noteID}/chat", protectedWrite(http.HandlerFunc(api.HandleNoteChat)))
	mux.Handle("GET /api/search", protected(http.HandlerFunc(api.HandleSearch)))
	mux.Handle("GET /api/review/due", protected(http.HandlerFunc(api.HandleDueReviews)))
	mux.Handle("POST /api/review/{cardID}", protectedWrite(http.HandlerFunc(api.HandleGradeReview)))
	mux.Handle("GET /api/stats", protected(http.HandlerFunc(api.HandleStats)))
}
