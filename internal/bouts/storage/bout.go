package storage

import "gorm.io/gorm"

type Bout struct {
	gorm.Model
	CardID             uint    `gorm:"not null"`
	BoutNumber         int     `gorm:"not null;uniqueIndex"`
	RedCorner          string  `gorm:"not null"`
	BlueCorner         string  `gorm:"not null"`
	WeightClass        int     `gorm:"not null"`
	GloveSize          string  `gorm:"not null"`
	RoundLength        float64 `gorm:"not null"`
	AgeCategory        string  `gorm:"not null"`
	Experience         string  `gorm:"not null"`
	RedCornerImageUrl  string
	BlueCornerImageUrl string
	Status             string `gorm:"not null"`
}
