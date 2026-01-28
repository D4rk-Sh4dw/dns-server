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
		
		v1.POST("/blocklists", CreateBlocklist)
		v1.GET("/blocklists", GetBlocklists)
		v1.POST("/blocklists/refresh", TriggerBlocklistUpdate)
		// Todo: Add policy routes
	}
}
