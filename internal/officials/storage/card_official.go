package storage

import "gorm.io/gorm"

// CardOfficial is the card↔official roster join row. A given (CardID,
// OfficialID) pair is unique — re-assigning updates the existing row's
// capability flags rather than creating a duplicate.
type CardOfficial struct {
	gorm.Model
	CardID       uint `gorm:"uniqueIndex:idx_card_official"`
	OfficialID   uint `gorm:"uniqueIndex:idx_card_official"`
	CanJudge     bool
	CanRef       bool
	CanTimekeep  bool
	CanSupervise bool
}
