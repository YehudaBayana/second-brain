package topics

import "net/http"

func (api *API) RegisterRoutes(
	mux *http.ServeMux,
	protected func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.Handle("GET /api/topics", protected(http.HandlerFunc(api.HandleTopics)))
	mux.Handle("POST /api/topics", protectedWrite(http.HandlerFunc(api.HandleTopics)))
}
