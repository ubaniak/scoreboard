package storage

import "gorm.io/gorm"

type Athlete struct {
	gorm.Model
	Name        string `gorm:"not null"`
	DateOfBirth string
	Nationality string
	ClubID      *uint
	ImageUrl    string
}
