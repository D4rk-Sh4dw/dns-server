package api

import (
	"context"
	"encoding/json"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/unified-dns/control-plane/internal/database"
)

type QueryLog struct {
	ClientIP   string `json:"client_ip"`
	Domain     string `json:"domain"`
	QueryType  string `json:"query_type"`
	Status     string `json:"status"`
	DurationMs uint64 `json:"duration_ms"`
	Timestamp  int64  `json:"timestamp"`
	ID         string `json:"id"`
}

// GetLogs fetches the latest logs from Redis Stream "dns_logs"
func GetLogs(c *gin.Context) {
	if database.Rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Redis not connected"})
		return
	}

	ctx := context.Background()
	// Fetch last 50 items from the stream (reverse order)
	// XRANGE dns_logs + - COUNT 50 is standard, but for "latest" usually XREVRANGE is used
	streams, err := database.Rdb.XRevRangeN(ctx, "dns_logs", "+", "-", 50).Result()
	
	if err != nil {
		// If stream doesn't exist yet, return empty list instead of error
		if err == redis.Nil {
			c.JSON(http.StatusOK, []QueryLog{})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs: " + err.Error()})
		return
	}

	var logs []QueryLog
	for _, msg := range streams {
		// Message ID is msg.ID
		// Values is map[string]interface{}
		// We expect "data" field containing JSON string
		
		dataStr, ok := msg.Values["data"].(string)
		if !ok {
			continue // Skip malformed entries
		}

		var log QueryLog
		if err := json.Unmarshal([]byte(dataStr), &log); err != nil {
			continue // Skip parse errors
		}
		log.ID = msg.ID // Attach Stream ID
		logs = append(logs, log)
	}

	// Just in case XRevRangeN order isn't guaranteed by the client wrapper (it usually is LIFO for Rev)
	// But let's trust Redis.
	
	c.JSON(http.StatusOK, logs)
}
