package reviews

import "net/http"

func (api *API) RegisterRoutes(
	mux *http.ServeMux,
	protected func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.Handle("GET /api/review/due", protected(http.HandlerFunc(api.HandleDueReviews)))
	mux.Handle("POST /api/review/{cardID}", protectedWrite(http.HandlerFunc(api.HandleGradeReview)))
}
