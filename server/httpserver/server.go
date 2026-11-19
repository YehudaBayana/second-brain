package httpserver

import (
	"net/http"

	"github.com/YehudaBayana/second-brain/server/config"
	"github.com/YehudaBayana/second-brain/server/middleware"
)

func Init(cfg config.Config, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              cfg.ServerAddress,
		Handler:           middleware.CORSWithOrigins(handler, cfg.AllowedOrigins),
		ReadHeaderTimeout: cfg.ServerReadHeaderTimeout,
		ReadTimeout:       cfg.ServerReadTimeout,
		WriteTimeout:      cfg.ServerWriteTimeout,
		IdleTimeout:       cfg.ServerIdleTimeout,
	}
}
