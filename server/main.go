package main

import (
	"context"
	_ "embed"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/YehudaBayana/second-brain/server/auth"
	"github.com/YehudaBayana/second-brain/server/job"
	"github.com/YehudaBayana/second-brain/server/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"google.golang.org/genai"
)

//go:embed schema.sql
var schema string

func main() {
	if err := godotenv.Load(); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			log.Printf("No .env file found; using process environment")
		}
	}

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		log.Fatal("DATABASE_URL must be set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Create database pool: %v", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatalf("Connect to database: %v", err)
	}
	if _, err := db.Exec(ctx, schema); err != nil {
		log.Fatalf("Initialize database schema (ensure pgvector is installed): %v", err)
	}

	var aiClient *genai.Client
	if apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY")); apiKey != "" {
		aiClient, err = genai.NewClient(ctx, &genai.ClientConfig{APIKey: apiKey})
		if err != nil {
			log.Fatalf("Initialize Gemini client: %v", err)
		}
	} else {
		log.Printf("GEMINI_API_KEY is not set; note generation and semantic search will return an error")
	}

	sessionStore := auth.NewSessionStore(db)
	authRepository := auth.NewRepository(sessionStore, db, strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true"))
	authHandler := auth.NewHandler(authRepository)
	learningAPI := NewLearningAPI(db, aiClient)
	redisAddress := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
	if redisAddress == "" {
		redisAddress = "localhost:6379"
	}
	redisClient := redis.NewClient(&redis.Options{Addr: redisAddress})
	defer redisClient.Close()
	protected := func(handler http.Handler) http.Handler {
		return sessionStore.Auth(handler)
	}
	protectedWrite := func(handler http.Handler) http.Handler {
		return sessionStore.Auth(sessionStore.CSRF(handler))
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /job", job.HandlePostJob(redisClient))
	mux.HandleFunc("POST /api/auth/register", authHandler.HandleRegister)
	mux.HandleFunc("POST /api/auth/login", authHandler.HandleLogin)
	mux.Handle("POST /api/auth/logout", protectedWrite(http.HandlerFunc(authHandler.HandleLogout)))
	mux.Handle("GET /api/auth/me", protected(http.HandlerFunc(authHandler.HandleMe)))

	mux.Handle("GET /api/topics", protected(http.HandlerFunc(learningAPI.HandleTopics)))
	mux.Handle("POST /api/topics", protectedWrite(http.HandlerFunc(learningAPI.HandleTopics)))
	mux.Handle("GET /api/notes", protected(http.HandlerFunc(learningAPI.HandleNotes)))
	mux.Handle("POST /api/notes", protectedWrite(http.HandlerFunc(learningAPI.HandleNotes)))
	mux.Handle("GET /api/search", protected(http.HandlerFunc(learningAPI.HandleSearch)))
	mux.Handle("GET /api/review/due", protected(http.HandlerFunc(learningAPI.HandleDueReviews)))
	mux.Handle("POST /api/review/{cardID}", protectedWrite(http.HandlerFunc(learningAPI.HandleGradeReview)))
	mux.Handle("GET /api/stats", protected(http.HandlerFunc(learningAPI.HandleStats)))

	server := &http.Server{
		Addr:              ":8080",
		Handler:           middleware.CORSMiddleware(mux),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      120 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	log.Printf("Second Brain API listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("HTTP server: %v", err)
	}
}
