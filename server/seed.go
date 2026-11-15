package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"google.golang.org/genai"
)

var SeedSentences = []string{
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

func InsertEmbeddedContentToDb(conn *pgx.Conn, genAiClient *genai.Client, ctx context.Context, sentencesContent []string) {
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
