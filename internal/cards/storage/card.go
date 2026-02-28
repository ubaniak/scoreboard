package storage

import (
	"gorm.io/gorm"
)

type Card struct {
	gorm.Model
	Name        string `gorm:"not null"`
	Description string `gorm:"not null"`
	Date        string `gorm:"not null"`
	Status      string `gorm:"not null"`
}
