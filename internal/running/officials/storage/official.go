package storage

import "gorm.io/gorm"

type Official struct {
	gorm.Model
	ID                    uint
	CardID                uint
	Name                  string `gorm:"not null"`
	Nationality           string
	Gender                string
	YearOfBirth           int
	RegistrationNumber    string
	ProvinceAffiliationID *uint
	NationAffiliationID   *uint
	// Old columns kept for migration:
	Province string // deprecated: use ProvinceAffiliationID
	Nation   string // deprecated: use NationAffiliationID
}
