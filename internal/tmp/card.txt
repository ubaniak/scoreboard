package storage

import (
	"gorm.io/gorm"
)

type Card struct {
	gorm.Model
	Name           string `gorm:"not null"`
	Description    string `gorm:"not null"`
	Date           string `gorm:"not null"`
	Status         string `gorm:"not null"`
	NumberOfJudges int    `gorm:"not null"`
	// Officials   []Official `gorm:"foreignKey:CardID"`
}

// // GetNextReadyBout returns the next bout in Ready state for this card, ordered by bout number
// func (c *Card) GetNextReadyBout(db *gorm.DB) (*Bout, error) {
// 	var bout Bout
// 	err := db.Where("card_id = ? AND status = ?", c.ID, BoutStatusReady).
// 		Order("bout_number asc").
// 		First(&bout).Error

// 	if err != nil {
// 		return nil, err
// 	}

// 	return &bout, nil
// }

// // GetAllReadyBouts returns all bouts in Ready state for this card, ordered by bout number
// func (c *Card) GetAllReadyBouts(db *gorm.DB) ([]Bout, error) {
// 	var bouts []Bout
// 	err := db.Where("card_id = ? AND status = ?", c.ID, BoutStatusReady).
// 		Order("bout_number asc").
// 		Find(&bouts).Error

// 	if err != nil {
// 		return nil, err
// 	}

// 	return bouts, nil
// }

// // GetBoutByNumber returns a specific bout by its number for this card
// func (c *Card) GetBoutByNumber(db *gorm.DB, boutNumber int) (*Bout, error) {
// 	var bout Bout
// 	err := db.Where("card_id = ? AND bout_number = ?", c.ID, boutNumber).
// 		First(&bout).Error

// 	if err != nil {
// 		return nil, err
// 	}

// 	return &bout, nil
// }
