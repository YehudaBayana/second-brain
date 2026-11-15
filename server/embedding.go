package main

import (
	"context"
	"log"
	"strconv"
	"strings"

	"google.golang.org/genai"
)

func ConvertEmbeddings(embeddings []*genai.ContentEmbedding) string {
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
	return ConvertEmbeddings(result.Embeddings)
}
