package api

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	{
		v1.POST("/tenants", CreateTenant)
		v1.GET("/tenants", GetTenants)
		// Todo: Add policy routes
	}
}
