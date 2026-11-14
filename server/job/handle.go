package job

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

const queueName = "job-queue"

type JobRequestBody struct {
	JobString string `json:"job_string"`
}

type Job struct {
	ID       string `json:"id"`
	Payload  string `json:"payload"`
	Attempts int    `json:"attempts"`
}

func handlePostJob(redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		defer req.Body.Close()

		var body JobRequestBody
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Wrap the string in a Job struct so each job tracks its own attempts
		job := Job{
			ID:       fmt.Sprintf("%d", time.Now().UnixNano()),
			Payload:  body.JobString,
			Attempts: 0,
		}

		jobBytes, err := json.Marshal(job)
		if err != nil {
			http.Error(w, "Failed to encode job", http.StatusInternalServerError)
			return
		}

		if err := redisClient.LPush(req.Context(), queueName, jobBytes).Err(); err != nil {
			http.Error(w, "Could not push job to Redis", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte(`{"message":"accepted"}`))
	}
}
