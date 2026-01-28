package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/unified-dns/control-plane/internal/database"
	"github.com/unified-dns/control-plane/internal/models"
	"github.com/unified-dns/control-plane/internal/services"
)

func CreateBlocklist(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
		Url  string `json:"url" binding:"required,url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blocklist := models.Blocklist{
		Name:    input.Name,
		Url:     input.Url,
		Enabled: true,
	}

	if err := database.DB.Create(&blocklist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create blocklist"})
		return
	}
	
	// Trigger async update
	go services.RefreshBlocklists()

	c.JSON(http.StatusCreated, blocklist)
}

func GetBlocklists(c *gin.Context) {
	var lists []models.Blocklist
	if err := database.DB.Find(&lists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lists"})
		return
	}
	c.JSON(http.StatusOK, lists)
}

func TriggerBlocklistUpdate(c *gin.Context) {
	go services.RefreshBlocklists()
	c.JSON(http.StatusOK, gin.H{"status": "Update triggered"})
}
