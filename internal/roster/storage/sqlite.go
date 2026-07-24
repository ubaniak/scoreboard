package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/roster/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&RosterEntry{}); err != nil {
		return nil, err
	}
	return &Sqlite{db: db}, nil
}

func toEntity(r RosterEntry) entities.RosterEntry {
	return entities.RosterEntry{
		ID:        r.ID,
		CardID:    r.CardID,
		AthleteID: r.AthleteID,
		Available: r.Available,
	}
}

func (s *Sqlite) Add(cardID, athleteID uint) error {
	var existing RosterEntry
	err := s.db.Where("card_id = ? AND athlete_id = ?", cardID, athleteID).First(&existing).Error
	if err == nil {
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return s.db.Create(&RosterEntry{CardID: cardID, AthleteID: athleteID, Available: true}).Error
}

func (s *Sqlite) Remove(cardID, athleteID uint) error {
	return s.db.Where("card_id = ? AND athlete_id = ?", cardID, athleteID).Delete(&RosterEntry{}).Error
}

func (s *Sqlite) SetAvailable(cardID, athleteID uint, available bool) error {
	res := s.db.Model(&RosterEntry{}).Where("card_id = ? AND athlete_id = ?", cardID, athleteID).Update("available", available)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return sberrs.ErrRecordNotFound
	}
	return nil
}

func (s *Sqlite) Get(cardID, athleteID uint) (*entities.RosterEntry, error) {
	var row RosterEntry
	if err := s.db.Where("card_id = ? AND athlete_id = ?", cardID, athleteID).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	e := toEntity(row)
	return &e, nil
}

func (s *Sqlite) ListForCard(cardID uint) ([]entities.RosterEntry, error) {
	var rows []RosterEntry
	if err := s.db.Where("card_id = ?", cardID).Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]entities.RosterEntry, len(rows))
	for i, r := range rows {
		result[i] = toEntity(r)
	}
	return result, nil
}
