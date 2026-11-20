package app

import (
	"net/http"

	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/config"
	"github.com/YehudaBayana/second-brain/server/dbbrowser"
	"github.com/YehudaBayana/second-brain/server/dbmigrate"
	"github.com/YehudaBayana/second-brain/server/infrastructure"
	"github.com/YehudaBayana/second-brain/server/learning"
)

type Handlers struct {
	Auth         *auth.Handler
	Learning     *learning.API
	Migrations   *dbmigrate.Handler
	SessionStore *auth.SessionStore
	DbBrowser    *dbbrowser.Handler
}

func InitHandlers(cfg config.Config, services infrastructure.Services) *Handlers {
	sessionStore := auth.NewSessionStore(services.Database)
	dbbrowserRepo := dbbrowser.NewRepository(services.Database)
	authRepository := auth.NewRepository(sessionStore, services.Database, cfg.CookieSecure)

	return &Handlers{
		Auth:         auth.NewHandler(authRepository),
		Learning:     learning.NewAPI(services.Database, services.Gemini),
		Migrations:   dbmigrate.NewHandler(services.Database),
		DbBrowser:    dbbrowser.NewHandler(dbbrowserRepo),
		SessionStore: sessionStore,
	}
}

func (handlers *Handlers) Protected(next http.Handler) http.Handler {
	return handlers.SessionStore.Auth(next)
}

func (handlers *Handlers) ProtectedWrite(next http.Handler) http.Handler {
	return handlers.SessionStore.Auth(handlers.SessionStore.CSRF(next))
}
