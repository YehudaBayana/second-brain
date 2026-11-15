package auth

import "net/http"

func (handler *Handler) RegisterRoutes(
	mux *http.ServeMux,
	protected func(http.Handler) http.Handler,
	protectedWrite func(http.Handler) http.Handler,
) {
	mux.HandleFunc("POST /api/auth/register", handler.HandleRegister)
	mux.HandleFunc("POST /api/auth/login", handler.HandleLogin)
	mux.Handle("POST /api/auth/logout", protectedWrite(http.HandlerFunc(handler.HandleLogout)))
	mux.Handle("GET /api/auth/me", protected(http.HandlerFunc(handler.HandleMe)))
}
