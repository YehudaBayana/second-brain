package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"google.golang.org/genai"
)

func VectorSearch(conn *pgx.Conn, genAiClient *genai.Client, ctx context.Context, searchTerm string) {
	// TODO: sorting by 1 - (embeddings <=> $1) forces Postgres to do math on every single row before sorting. When your table grows to thousands of notes, sorting directly by the distance (embeddings <=> $1 ascending) lets Postgres use a vector index to jump straight to the closest matches.
	vectorValue := textToVectorString(genAiClient, ctx, searchTerm)

	query := `
		SELECT 
			id, 
			content, 
			1 - (embeddings <=> $1) AS similarity
		FROM practice
		ORDER BY similarity DESC
		LIMIT 3
	`

	rows, err := conn.Query(ctx, query, vectorValue)
	if err != nil {
		fmt.Println("failed to query:", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var content string
		var similarity float64

		if err := rows.Scan(&id, &content, &similarity); err != nil {
			fmt.Println("scan err:", err)
			return
		}

		fmt.Printf("ID: %d | Similarity: %.4f | Content: %s\n", id, similarity, content)
	}
}

func KeywordSearch(conn *pgx.Conn, ctx context.Context, searchTerm string) {
	query := `
		SELECT 
			id, 
			content, 
			ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) AS rank
		FROM practice
		WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
		ORDER BY rank DESC
		LIMIT 3
	`

	rows, err := conn.Query(ctx, query, searchTerm)
	if err != nil {
		fmt.Println("failed to query:", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var content string
		var rank float64

		if err := rows.Scan(&id, &content, &rank); err != nil {
			fmt.Println("scan err:", err)
			return
		}

		fmt.Printf("ID: %d | Score: %.4f | Content: %s\n", id, rank, content)
	}
}

func HybridSearch(conn *pgx.Conn, genAiClient *genai.Client, ctx context.Context, searchTerm string) {
	vectorValue := textToVectorString(genAiClient, ctx, searchTerm)

	// 1. vector_results: ranks rows 1, 2, 3... by AI meaning
	// 2. keyword_results: ranks rows 1, 2, 3... by exact word match
	// 3. FULL OUTER JOIN combines both lists and adds their rank scores together
	query := `
	WITH vector_results AS (
		SELECT id, content, ROW_NUMBER() OVER (ORDER BY embeddings <=> $1) AS rank
		FROM practice
		LIMIT 10
	),
	keyword_results AS (
		SELECT id, content, ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) DESC) AS rank
		FROM practice
		WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $2)
		LIMIT 10
	)
	SELECT 
		COALESCE(v.id, k.id) AS id,
		COALESCE(v.content, k.content) AS content,
		COALESCE(1.0 / (60 + v.rank), 0.0) + COALESCE(1.0 / (60 + k.rank), 0.0) AS combined_score
	FROM vector_results v
	FULL OUTER JOIN keyword_results k ON v.id = k.id
	ORDER BY combined_score DESC
	LIMIT 5;
	`

	rows, err := conn.Query(ctx, query, vectorValue, searchTerm)
	if err != nil {
		fmt.Println("hybrid search failed:", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var content string
		var score float64

		if err := rows.Scan(&id, &content, &score); err != nil {
			fmt.Println("scan err:", err)
			return
		}

		fmt.Printf("ID: %d | Combined Score: %.4f | Content: %s\n", id, score, content)
	}
}
