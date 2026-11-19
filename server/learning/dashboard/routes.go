package dashboard

import "net/http"

func (api *API) RegisterRoutes(mux *http.ServeMux, protected func(http.Handler) http.Handler) {
	mux.Handle("GET /api/stats", protected(http.HandlerFunc(api.HandleStats)))
}
