package main

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

func processQueue(ctx context.Context, redisClient *redis.Client) {
	// Loop forever so the worker keeps listening
	for {
		// BRPop blocks (waits) until an item is available
		result, err := redisClient.BRPop(ctx, 0, "job-queue").Result()
		if err != nil {
			log.Fatal("Failed to pop from Redis: ", err)
		}

		// result[0] is "job-queue", result[1] is the actual string value
		fmt.Println("Job processed:", result[1])
	}
}

func main() {
	ctx := context.Background()
	redisClient := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	if _, err := redisClient.Ping(ctx).Result(); err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}

	fmt.Println("Worker started. Waiting for jobs...")
	processQueue(ctx, redisClient)
}
