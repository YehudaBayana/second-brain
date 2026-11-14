package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/YehudaBayana/second-brain/server/job"
	"github.com/redis/go-redis/v9"
)

func main() {
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /job", job.HandlePostJob(redisClient))

	fmt.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
