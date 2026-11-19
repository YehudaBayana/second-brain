package notes

import "net/http"

func (api *API) RegisterRoutes(
	mux *http.ServeMux,
	protected func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.Handle("GET /api/notes", protected(http.HandlerFunc(api.HandleNotes)))
	mux.Handle("POST /api/notes", protectedWrite(http.HandlerFunc(api.HandleNotes)))
	mux.Handle("GET /api/notes/{noteID}", protected(http.HandlerFunc(api.HandleNote)))
	mux.Handle("POST /api/notes/{noteID}/chat", protectedWrite(http.HandlerFunc(api.HandleNoteChat)))
}
