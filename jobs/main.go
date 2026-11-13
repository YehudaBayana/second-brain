package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	queueName           = "job-queue"
	processingQueueName = "job-processing"
	deadQueueName       = "job-dead-list"
	maxAttempts         = 3
)

type Job struct {
	ID       string `json:"id"`
	Payload  string `json:"payload"`
	Attempts int    `json:"attempts"`
}

func main() {
	ctx := context.Background()
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	if _, err := redisClient.Ping(ctx).Result(); err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}

	// 1. Recover any jobs that were interrupted if the worker crashed earlier
	recoverInterruptedJobs(ctx, redisClient)

	fmt.Println("Worker started. Waiting for jobs...")
	processQueue(ctx, redisClient)
}

// recoverInterruptedJobs moves anything stuck in processingQueue back to the main queue
func recoverInterruptedJobs(ctx context.Context, redisClient *redis.Client) {
	for {
		// Move from right of processing queue back to right of main queue so it runs next
		rawJob, err := redisClient.LMove(ctx, processingQueueName, queueName, "RIGHT", "RIGHT").Result()
		if err == redis.Nil {
			// Processing queue is empty, recovery complete
			break
		}
		if err != nil {
			log.Fatalf("Error recovering jobs: %v", err)
		}
		fmt.Println("Recovered interrupted job:", rawJob)
	}
}

func processQueue(ctx context.Context, redisClient *redis.Client) {
	for {
		// Atomically pop from right of job-queue and push to left of job-processing
		rawJob, err := redisClient.BLMove(ctx, queueName, processingQueueName, "RIGHT", "LEFT", 0).Result()
		if err != nil {
			log.Fatalf("Failed to move job from Redis: %v", err)
		}

		processJob(ctx, redisClient, rawJob)
	}
}

func processJob(ctx context.Context, redisClient *redis.Client, rawJob string) {
	var job Job
	if err := json.Unmarshal([]byte(rawJob), &job); err != nil {
		fmt.Println("Invalid job JSON, removing:", rawJob)
		redisClient.LRem(ctx, processingQueueName, 1, rawJob)
		return
	}

	fmt.Printf("Working on job [%s] (attempt %d)...\n", job.Payload, job.Attempts+1)

	// Simulate work taking 3 seconds so you have time to kill the worker mid-job!
	time.Sleep(3 * time.Second)

	// Fail 50% of the time on purpose
	if rand.Intn(2) == 0 {
		handleFailure(ctx, redisClient, rawJob, job)
		return
	}

	// Success: remove the job from the processing queue
	redisClient.LRem(ctx, processingQueueName, 1, rawJob)
	fmt.Printf("Job succeeded: %s\n", job.Payload)
}

func handleFailure(ctx context.Context, redisClient *redis.Client, rawJob string, job Job) {
	job.Attempts++
	fmt.Printf("Job failed: %s (total failures: %d)\n", job.Payload, job.Attempts)

	// Remove the old version of the job from the processing queue
	redisClient.LRem(ctx, processingQueueName, 1, rawJob)

	updatedBytes, _ := json.Marshal(job)

	// If it hit 3 failures, send it to the dead list
	if job.Attempts >= maxAttempts {
		fmt.Printf("Moving job to dead list: %s\n", job.Payload)
		redisClient.LPush(ctx, deadQueueName, updatedBytes)
		return
	}

	// Exponential backoff: 1s after 1st fail, 2s after 2nd fail
	backoff := time.Duration(1<<(job.Attempts-1)) * time.Second
	fmt.Printf("Backing off for %v before retrying...\n", backoff)
	time.Sleep(backoff)

	// Push updated job (with incremented Attempts) back into the main queue
	redisClient.LPush(ctx, queueName, updatedBytes)
}
