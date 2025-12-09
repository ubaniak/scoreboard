package storage

import "gorm.io/gorm"

type Official struct {
	gorm.Model
	ID     uint
	CardID uint   `gorm:"not null"`
	Name   string `gorm:"not null"`
}
