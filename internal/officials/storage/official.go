package storage

import "gorm.io/gorm"

type Official struct {
	gorm.Model
	ID                 uint
	CardID             uint
	Name               string `gorm:"not null"`
	Nationality        string
	Gender             string
	YearOfBirth        int
	RegistrationNumber string
}
