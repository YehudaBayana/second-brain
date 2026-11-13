package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/redis/go-redis/v9"
)

type JobResponse struct {
	Message string `json:"message"`
}

type JobRequestBody struct {
	JobString string `json:"job_string"`
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}

func handlePostJob(redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		defer req.Body.Close()

		var userRequest JobRequestBody
		if err := json.NewDecoder(req.Body).Decode(&userRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Push to Redis
		if err := redisClient.LPush(req.Context(), "job-queue", userRequest.JobString).Err(); err != nil {
			log.Printf("Failed to push job to Redis: %v", err)
			http.Error(w, "Could not push job to Redis", http.StatusInternalServerError)
			return
		}

		// Set headers and status BEFORE encoding the response body
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(JobResponse{Message: "accepted"})
	}
}

func main() {
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthCheck)
	mux.HandleFunc("POST /job", handlePostJob(redisClient))

	fmt.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
