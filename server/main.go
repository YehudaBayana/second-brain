package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

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
	GeminiApiKey := os.Getenv("GEMINI_API_KEY")

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
	genAiClient, errGenAi := genai.NewClient(ctx, &genai.ClientConfig{APIKey: GeminiApiKey})
	if errGenAi != nil {
		fmt.Println("gen ai error: ", errGenAi)
	}

	sentences := []string{
		"i like to cook a stake on the grill",
		"when i eat hamburger i always eat french fries as a snack along with it",
		"i think that the most expensive fruit is pineapple",
		"what is the best restaurant in the world?",
		"which restaurant is the most expensive in the world?",
		"how to cook pasta?",
		"you never eat pizza without drinking coca cola",
		"what is the ingera food and where it is originated from",
		"i think that asian food is the best food in the world but not the healthiest",
		"how many calories is it should a person eat to stay healthy?",
		"Apple computers are the most efficient out there",
		"i hope google will produce a new type of os that is designed to run AI on it and not rely on the cloud servers",
		"what happened to nvidia lately? i see that their stock market is dropping",
		"meta are getting good at developing smart glasses and vr headsets",
		"Linux is my favorite operating system for running backend servers.",
		"Why do smartphones lose battery life so fast after two years?",
		"Learning how databases store and find data makes you a much better programmer.",
		"Cloud servers make it easy to put a website online in just a few minutes.",
		"Mechanical keyboards feel much nicer to type on than laptop keyboards.",
		"Open source software lets developers around the world build tools together for free.",
	}
	fmt.Println("tableCount ", tableCount)
	if tableCount < 1 {
		insertEmbeddedContentToDb(conn, genAiClient, ctx, sentences)
	}

	getEmbeddedContentFromDb(conn, genAiClient, ctx, "github")
	mux := http.NewServeMux()
	mux.HandleFunc("POST /job", job.HandlePostJob(redisClient))

	fmt.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func convertEmbeddings(embeddings []*genai.ContentEmbedding) string {
	var res strings.Builder
	res.WriteString("[")
	for i, value := range embeddings[0].Values {
		res.WriteString(strconv.FormatFloat(float64(value), 'f', -1, 32))
		if i < len(embeddings[0].Values)-1 {
			res.WriteString(",")
		}
	}
	res.WriteString("]")
	return res.String()
}

func insertEmbeddedContentToDb(conn *pgx.Conn, genAiClient *genai.Client, ctx context.Context, sentencesContent []string) {
	sentencesEmbeddings := make([]string, 0, len(sentencesContent))
	for _, value := range sentencesContent {
		sentencesEmbeddings = append(sentencesEmbeddings, textToVectorString(genAiClient, ctx, value))
	}

	query := `INSERT INTO practice (content, embeddings) SELECT * FROM UNNEST($1::text[],$2::vector[])`

	_, err := conn.Exec(ctx, query, sentencesContent, sentencesEmbeddings)
	if err != nil {
		fmt.Println("Bulk insert failed:", err)
	}
}

func getEmbeddedContentFromDb(conn *pgx.Conn, genAiClient *genai.Client, ctx context.Context, searchTerm string) {
	vectorValue := textToVectorString(genAiClient, ctx, searchTerm)

	query := `
	SELECT id, content, (embeddings <=> $1) AS distance
	FROM practice
	ORDER BY distance ASC
	LIMIT 3
	`

	rows, err := conn.Query(ctx, query, vectorValue)
	if err != nil {
		fmt.Println("failed to query:", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var content string
		var id int
		var distance int

		rows.Scan(&id, &content, &distance)

		fmt.Println("id: ", id)
		fmt.Println("content: ", content)
		fmt.Println("distance: ", distance)
	}

	if err := rows.Err(); err != nil {
		fmt.Println("row err ", err)
	}
}

func textToVectorString(genAiClient *genai.Client, ctx context.Context, content string) string {
	contents := []*genai.Content{
		genai.NewContentFromText(content, genai.RoleUser),
	}

	result, err := genAiClient.Models.EmbedContent(ctx,
		"gemini-embedding-2",
		contents,
		&genai.EmbedContentConfig{
			OutputDimensionality: genai.Ptr[int32](1536),
		},
	)

	if err != nil {
		log.Fatal(err)
	}
	// convertedEmbeddingsAsString := convertEmbeddings(result.Embeddings)
	return convertEmbeddings(result.Embeddings)
}
