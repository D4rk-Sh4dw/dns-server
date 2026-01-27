package api

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	{
		v1.POST("/tenants", CreateTenant)
		v1.GET("/tenants", GetTenants)
		v1.GET("/logs", GetLogs)
		// Todo: Add policy routes
	}
}
