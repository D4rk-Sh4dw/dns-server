package services

import (
	"bufio"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/unified-dns/control-plane/internal/database"
	"github.com/unified-dns/control-plane/internal/models"
)

// Simple in-memory lock/mutex to prevent concurrent updates
var updateMutex sync.Mutex

func RefreshBlocklists() error {
	updateMutex.Lock()
	defer updateMutex.Unlock()

	var lists []models.Blocklist
	if err := database.DB.Where("enabled = ?", true).Find(&lists).Error; err != nil {
		return err
	}

	totalDomains := 0
	ctx := database.Rdb.Context()
	pipe := database.Rdb.Pipeline()

	// 1. Clear current global set? Or maybe use a temp set and swap?
	// For safety, let's use a temp set "blocklist:global:temp"
	tempKey := "blocklist:global:temp"
	pipe.Del(ctx, tempKey)

	for _, list := range lists {
		domains, err := fetchAndParse(list.Url)
		if err != nil {
			fmt.Printf("Failed to fetch list %s: %v\n", list.Name, err)
			continue
		}
		
		fmt.Printf("List %s: Found %d domains\n", list.Name, len(domains))
		
		// Batch add to Redis (chunks of 1000)
		chunkSize := 1000
		for i := 0; i < len(domains); i += chunkSize {
			end := i + chunkSize
			if end > len(domains) {
				end = len(domains)
			}
			// SADD accepts []interface{}
			args := make([]interface{}, end-i)
			for j, d := range domains[i:end] {
				args[j] = d
			}
			pipe.SAdd(ctx, tempKey, args...)
		}
		totalDomains += len(domains)
	}

	// Rename temp to actual (Atomic swap)
	pipe.Rename(ctx, tempKey, "blocklist:global")
	
	// Publish update event
	// Data Plane will read "blocklist:global"
	// We send a dummy message to trigger the pull
	pipe.Publish(ctx, "blocklist_update", "reload")

	_, err := pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to execute redis pipeline: %v", err)
	}

	fmt.Printf("Blocklist update complete. Total unique domains (approx): %d\n", totalDomains)
	return nil
}

func fetchAndParse(url string) ([]string, error) {
	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	var domains []string
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		// Basic parsing: remove 127.0.0.1 or 0.0.0.0 prefix if present (hosts file format)
		fields := strings.Fields(line)
		if len(fields) >= 2 && (fields[0] == "127.0.0.1" || fields[0] == "0.0.0.0") {
			domains = append(domains, fields[1])
		} else if len(fields) == 1 {
			// standard domain list
			domains = append(domains, fields[0])
		}
	}
	return domains, nil
}
