package storage

import "gorm.io/gorm"

type RosterEntry struct {
	gorm.Model
	CardID    uint `gorm:"not null;uniqueIndex:idx_roster_card_athlete"`
	AthleteID uint `gorm:"not null;uniqueIndex:idx_roster_card_athlete"`
	Available bool `gorm:"default:true;not null"`
}
