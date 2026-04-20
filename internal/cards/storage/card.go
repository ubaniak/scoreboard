package storage

import (
	"gorm.io/gorm"
)

type Card struct {
	gorm.Model
	Name              string `gorm:"not null"`
	Description       string `gorm:"not null"`
	Date              string `gorm:"not null"`
	Status            string `gorm:"not null"`
	NumberOfJudges    int    `gorm:"default:5;not null"`
	ImageUrl          string
	ShowCardImage     bool `gorm:"default:false"`
	ShowAthleteImages bool `gorm:"default:false"`
	ShowClubImages    bool `gorm:"default:false"`
}
