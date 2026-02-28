package storage

import "gorm.io/gorm"

type Official struct {
	gorm.Model
	AuditLog
	CardID uint    `gorm:"not null"`
	Card   Card    `gorm:"foreignKey:CardID"`
	Name   string  `gorm:"not null"`
	Scores []Score `gorm:"foreignKey:OfficialID"`
}
