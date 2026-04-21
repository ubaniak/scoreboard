package storage

import "gorm.io/gorm"

type Athlete struct {
	gorm.Model
	Name             string `gorm:"not null"`
	AgeCategory      string
	Nationality      string
	ClubID           *uint
	ProvinceName     string
	ProvinceImageUrl string
	NationName       string
	NationImageUrl   string
	ImageUrl         string
}
