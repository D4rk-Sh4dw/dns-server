package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/unified-dns/control-plane/internal/database"
	"github.com/unified-dns/control-plane/internal/models"
	"github.com/unified-dns/control-plane/internal/api"
)

func main() {
	// Initialize Database
	database.Init()
	database.InitRedis()

	// Run Migrations
	err := database.DB.AutoMigrate(&models.Tenant{}, &models.Policy{})
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Setup Router
	r := gin.Default()

	// CORS Configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://127.0.0.1:3000"} // Frontend URL
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type"}
	r.Use(cors.New(config))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Register Routes
	api.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Control Plane starting on port %s...", port)
	r.Run(":" + port)
}
