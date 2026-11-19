package embedding

import (
	"context"
	"errors"

	"google.golang.org/genai"
)

func EmbedText(ctx context.Context, client *genai.Client, content string) (string, error) {
	if client == nil {
		return "", errors.New("Gemini client is not configured")
	}
	const maxEmbeddingTextRunes = 8000
	runes := []rune(content)
	if len(runes) > maxEmbeddingTextRunes {
		content = string(runes[:maxEmbeddingTextRunes])
	}
	result, err := client.Models.EmbedContent(ctx, "gemini-embedding-2",
		[]*genai.Content{genai.NewContentFromText(content, genai.RoleUser)},
		&genai.EmbedContentConfig{OutputDimensionality: genai.Ptr[int32](1536)},
	)
	if err != nil {
		return "", err
	}
	if result == nil || len(result.Embeddings) == 0 {
		return "", errors.New("Gemini returned no embedding")
	}
	return VectorString(result.Embeddings[0].Values)
}
