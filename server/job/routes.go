package job

import (
	"net/http"

	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(mux *http.ServeMux, redisClient *redis.Client) {
	mux.HandleFunc("POST /job", HandlePostJob(redisClient))
}
