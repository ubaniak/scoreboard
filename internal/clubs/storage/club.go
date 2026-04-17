package storage

import "gorm.io/gorm"

type Club struct {
	gorm.Model
	Name     string `gorm:"not null"`
	Location string
	ImageUrl string
}
