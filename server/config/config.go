package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL             string
	RedisAddress            string
	GeminiAPIKey            string
	CookieSecure            bool
	AllowedOrigins          []string
	ServerAddress           string
	ServerReadHeaderTimeout time.Duration
	ServerReadTimeout       time.Duration
	ServerWriteTimeout      time.Duration
	ServerIdleTimeout       time.Duration
}

func Load() (Config, error) {
	loadEnvironmentFiles()

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL must be set")
	}

	redisAddress := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
	if redisAddress == "" {
		redisAddress = "localhost:6379"
	}

	return Config{
		DatabaseURL:             databaseURL,
		RedisAddress:            redisAddress,
		GeminiAPIKey:            strings.TrimSpace(os.Getenv("GEMINI_API_KEY")),
		CookieSecure:            strings.EqualFold(os.Getenv("COOKIE_SECURE"), "true"),
		AllowedOrigins:          loadAllowedOrigins(),
		ServerAddress:           ":8080",
		ServerReadHeaderTimeout: 10 * time.Second,
		ServerReadTimeout:       30 * time.Second,
		ServerWriteTimeout:      120 * time.Second,
		ServerIdleTimeout:       120 * time.Second,
	}, nil
}

func loadEnvironmentFiles() {
	if err := godotenv.Load(); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			// Environment variables supplied by the process remain available.
		}
	}
}

func loadAllowedOrigins() []string {
	var origins []string
	for _, origin := range strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",") {
		origin = strings.TrimRight(strings.TrimSpace(origin), "/")
		if origin != "" {
			origins = append(origins, origin)
		}
	}
	if len(origins) == 0 {
		origins = []string{"http://localhost:3000"}
	}
	return origins
}
