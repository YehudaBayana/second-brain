package infrastructure

import (
	"context"

	"github.com/YehudaBayana/second-brain/server/config"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"google.golang.org/genai"
)

type Services struct {
	Database *pgxpool.Pool
	Redis    *redis.Client
	Gemini   *genai.Client
}

func Connect(ctx context.Context, cfg config.Config) (Services, func(), error) {
	database, err := ConnectDatabase(ctx, cfg.DatabaseURL)
	if err != nil {
		return Services{}, nil, err
	}

	redisClient := NewRedis(cfg.RedisAddress)

	geminiClient, err := ConnectGemini(ctx, cfg.GeminiAPIKey)
	if err != nil {
		_ = redisClient.Close()
		database.Close()
		return Services{}, nil, err
	}

	cleanup := func() {
		_ = redisClient.Close()
		database.Close()
	}

	return Services{
		Database: database,
		Redis:    redisClient,
		Gemini:   geminiClient,
	}, cleanup, nil
}
