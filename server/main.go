package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/YehudaBayana/second-brain/server/job"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"google.golang.org/genai"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("No .env file found")
	}

	ctx := context.Background()
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")

	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	conn, err := pgx.Connect(ctx, "postgres://postgres:123456@localhost:5432/second_brain_db")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	var tableCount int

	errCount := conn.QueryRow(ctx, "select count(*) from practice").Scan(&tableCount)
	if errCount != nil {
		log.Fatalln("error querying count")
	}

	genAiClient, errGenAi := genai.NewClient(ctx, &genai.ClientConfig{APIKey: geminiAPIKey})
	if errGenAi != nil {
		fmt.Println("gen ai error: ", errGenAi)
	}

	if tableCount < 1 {
		InsertEmbeddedContentToDb(conn, genAiClient, ctx, SeedSentences)
	}

	// VectorSearch(conn, genAiClient, ctx, "cooking")
	// KeywordSearch(conn, ctx, "cooking")
	HybridSearch(conn, genAiClient, ctx, "cooking")
	mux := http.NewServeMux()
	mux.HandleFunc("POST /job", job.HandlePostJob(redisClient))

	fmt.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
