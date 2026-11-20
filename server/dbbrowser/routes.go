package dbbrowser

import (
	"net/http"
)

func (handler *Handler) RegisterRoutes(
	mux *http.ServeMux,
	protectedRead func(http.Handler) http.Handler,
	_ func(http.Handler) http.Handler,
) {
	mux.Handle("GET /api/database/tables", protectedRead(http.HandlerFunc(handler.GetAllTables)))
}
