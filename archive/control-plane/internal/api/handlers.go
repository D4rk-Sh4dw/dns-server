package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/unified-dns/control-plane/internal/database"
	"github.com/unified-dns/control-plane/internal/models"
)

type CreateTenantRequest struct {
	Name string `json:"name" binding:"required"`
}

func CreateTenant(c *gin.Context) {
	var req CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenant := models.Tenant{
		ID:        uuid.New().String(),
		Name:      req.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if result := database.DB.Create(&tenant); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Publish Event
	go func() {
		database.PublishUpdate("config_updates", map[string]interface{}{
			"type": "tenant_created",
			"payload": tenant,
		})
	}()

	c.JSON(http.StatusCreated, tenant)
}

func GetTenants(c *gin.Context) {
	var tenants []models.Tenant
	if result := database.DB.Find(&tenants); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, tenants)
}
