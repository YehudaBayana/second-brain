package infrastructure

import (
	"context"
	"fmt"
	"log"

	"github.com/YehudaBayana/second-brain/server/config"
	"google.golang.org/genai"
)

func ConnectGemini(ctx context.Context, apiKey string) (*genai.Client, error) {
	if apiKey == "" {
		log.Printf("GEMINI_API_KEY is not set; note generation and semantic search will return an error")
		return nil, nil
	}
	timeout := config.GeminiGenerationAttemptTimeout
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:      apiKey,
		HTTPOptions: genai.HTTPOptions{Timeout: &timeout},
	})
	if err != nil {
		return nil, fmt.Errorf("initialize Gemini client: %w", err)
	}
	return client, nil
}
