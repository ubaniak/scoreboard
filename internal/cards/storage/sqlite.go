package storage

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/cards/entities"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Card{}, &Settings{}, &Official{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Create(name, date string) error {

	card := &Card{
		Name: name,
		Date: date,
	}

	if err := s.db.Create(card).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) Get() ([]entities.Card, error) {
	var cards []Card
	if err := s.db.Find(&cards).Error; err != nil {
		return nil, err
	}

	var result []entities.Card
	for _, c := range cards {
		result = append(result, entities.Card{
			ID:   c.ID,
			Name: c.Name,
			Date: c.Date,
		})
	}
	return result, nil
}

func (s *Sqlite) GetByID(id uint) (*entities.Card, error) {
	var card Card
	if err := s.db.Preload("Settings").First(&card, id).Error; err != nil {
		return nil, err
	}
	var result = &entities.Card{
		ID:   card.ID,
		Name: card.Name,
		Date: card.Date,
		Settings: &entities.Settings{
			NumberOfJudges: card.Settings.NumberOfJudges,
		},
	}
	return result, nil
}

func (s *Sqlite) UpdateSettings(id uint, settings *entities.Settings) error {
	var cardSettings Settings
	if err := s.db.Where("card_id = ?", id).First(&cardSettings).Error; err != nil {
		return err
	}

	cardSettings.NumberOfJudges = settings.NumberOfJudges

	if err := s.db.Save(&cardSettings).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) AddOfficial(id uint, name string) error {
	official := &Official{
		CardID: id,
		Name:   name,
	}

	if err := s.db.Create(official).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) GetOfficials(id uint) ([]entities.Official, error) {
	var officials []Official
	if err := s.db.Where("card_id = ?", id).Find(&officials).Error; err != nil {
		return nil, err
	}

	var result []entities.Official
	for _, o := range officials {
		result = append(result, entities.Official{
			ID:   o.ID,
			Name: o.Name,
		})
	}
	return result, nil
}

func (s *Sqlite) DeleteOfficial(cardId, officialId uint) error {
	if err := s.db.Where("card_id = ? AND id = ?", cardId, officialId).Delete(&Official{}).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) UpdateOfficial(cardId, officialId uint, name string) error {
	var official Official
	if err := s.db.Where("card_id = ? AND id = ?", cardId, officialId).First(&official).Error; err != nil {
		return err
	}

	official.Name = name

	if err := s.db.Save(&official).Error; err != nil {
		return err
	}

	return nil
}
