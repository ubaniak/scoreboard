package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/cards/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Card{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Create(c *entities.Card) error {

	card := &Card{
		Name:   c.Name,
		Date:   c.Date,
		Status: string(c.Status),
	}

	if err := s.db.Create(card).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) List() ([]entities.Card, error) {
	var cards []Card
	if err := s.db.Find(&cards).Error; err != nil {
		return nil, err
	}

	var result []entities.Card
	for _, c := range cards {
		result = append(result, entities.Card{
			ID:     c.ID,
			Name:   c.Name,
			Date:   c.Date,
			Status: entities.CardStatus(c.Status),
		})
	}
	return result, nil
}

func (s *Sqlite) Current() (*entities.Card, error) {
	var card Card
	if err := s.db.Where("status = ?", entities.CardStatusInProgress).First(&card).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}

	var result = &entities.Card{
		ID:     card.ID,
		Name:   card.Name,
		Date:   card.Date,
		Status: entities.CardStatus(card.Status),
	}
	return result, nil
}

func (s *Sqlite) Get(id uint) (*entities.Card, error) {
	var card Card
	if err := s.db.First(&card, id).Error; err != nil {
		return nil, err
	}
	var result = &entities.Card{
		ID:     card.ID,
		Name:   card.Name,
		Date:   card.Date,
		Status: entities.CardStatus(card.Status),
	}
	return result, nil
}

func (s *Sqlite) Update(id uint, toUpdate *entities.UpdateCard) error {
	var card Card
	if err := s.db.Where("id = ?", id).First(&card).Error; err != nil {
		return err
	}

	if toUpdate.Date != nil {
		card.Date = *toUpdate.Date
	}

	if toUpdate.Name != nil {
		card.Name = *toUpdate.Name
	}

	if toUpdate.Status != nil {
		card.Status = *toUpdate.Status
	}

	if err := s.db.Save(card).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) Delete(id uint) error {
	if err := s.db.Where("id = ?", id).Delete(&Card{}).Error; err != nil {
		return err
	}
	return nil
}
