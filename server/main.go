package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/YehudaBayana/second-brain/server/app"
	"github.com/YehudaBayana/second-brain/server/config"
	"github.com/YehudaBayana/second-brain/server/httpserver"
	"github.com/YehudaBayana/second-brain/server/infrastructure"
	"github.com/YehudaBayana/second-brain/server/routes"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	services, cleanup, err := infrastructure.Connect(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer cleanup()

	handlers := app.NewHandlers(cfg, services)
	mux := routes.New(handlers)
	server := httpserver.New(cfg, mux)

	log.Printf("Second Brain API listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("HTTP server: %v", err)
	}
}
