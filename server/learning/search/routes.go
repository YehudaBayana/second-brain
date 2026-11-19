package search

import "net/http"

func (api *API) RegisterRoutes(mux *http.ServeMux, protected func(http.Handler) http.Handler) {
	mux.Handle("GET /api/search", protected(http.HandlerFunc(api.HandleSearch)))
}
