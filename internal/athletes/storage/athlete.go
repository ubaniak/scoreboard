package storage

import "gorm.io/gorm"

type Athlete struct {
	gorm.Model
	Name        string `gorm:"not null"`
	DateOfBirth string
	ClubID      *uint
	ImageUrl    string
}
