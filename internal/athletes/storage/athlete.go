package storage

import "gorm.io/gorm"

type Athlete struct {
	gorm.Model
	Name                  string `gorm:"not null"`
	AgeCategory           string
	Nationality           string
	ClubAffiliationID     *uint
	ProvinceAffiliationID *uint
	NationAffiliationID   *uint
	ImageUrl              string
	// Old columns kept for migration:
	ClubID           *uint  // deprecated: use ClubAffiliationID
	ProvinceName     string // deprecated: use ProvinceAffiliationID
	ProvinceImageUrl string // deprecated: use ProvinceAffiliationID
	NationName       string // deprecated: use NationAffiliationID
	NationImageUrl   string // deprecated: use NationAffiliationID
}
