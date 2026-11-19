package learning

import "net/http"

func (api *API) RegisterRoutes(
	mux *http.ServeMux,
	protected func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	api.topics.RegisterRoutes(mux, protected, protectedWrite)
	api.notes.RegisterRoutes(mux, protected, protectedWrite)
	api.search.RegisterRoutes(mux, protected)
	api.reviews.RegisterRoutes(mux, protected, protectedWrite)
	api.dashboard.RegisterRoutes(mux, protected)
}
