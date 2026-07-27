package storage

import "gorm.io/gorm"

type Affiliation struct {
	gorm.Model
	Name     string `gorm:"not null"`
	Type     string `gorm:"not null;index"`
	ImageUrl string
}
