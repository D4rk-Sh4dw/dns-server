package database

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client
var ctx = context.Background()

func InitRedis() {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}
	
	addr := fmt.Sprintf("%s:6379", redisHost)

	Rdb = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err := Rdb.Ping(ctx).Result()
	if err != nil {
		fmt.Printf("Warning: Failed to connect to Redis at %s: %v\n", addr, err)
		// Don't panic, as Redis might be optional for basic API
	} else {
		fmt.Println("Redis connected successfully.")
	}
}

func PublishUpdate(channel string, message interface{}) error {
    if Rdb == nil {
        return fmt.Errorf("redis not initialized")
    }
    jsonBytes, err := json.Marshal(message)
    if err != nil {
        return err
    }
    return Rdb.Publish(ctx, channel, jsonBytes).Err()
}
