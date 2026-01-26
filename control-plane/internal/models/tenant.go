package models

import (
	"time"

	"gorm.io/gorm"
)

type Tenant struct {
	ID        string `gorm:"primaryKey" json:"id"`
	Name      string `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	Policies []Policy `gorm:"foreignKey:TenantID" json:"policies,omitempty"`
}

type Policy struct {
	ID        uint `gorm:"primaryKey"`
	TenantID  string
	Name      string
	Type      string // "BLOCK", "ALLOW"
	Value     string // Domain or Regex
	CreatedAt time.Time
}
