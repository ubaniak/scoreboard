package storage

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/officials/entities"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Official{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Save(cardId uint, official *entities.Official) error {
	o := &Official{
		ID:     official.ID,
		CardID: cardId,
		Name:   official.Name,
	}
	if err := s.db.Save(o).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) Get(cardId uint) ([]entities.Official, error) {

	var officials []Official
	var response []entities.Official
	if err := s.db.Where("card_id = ?", cardId).Find(&officials).Error; err != nil {
		return []entities.Official{}, err
	}

	for _, o := range officials {
		r := entities.Official{
			ID:   o.ID,
			Name: o.Name,
		}
		response = append(response, r)
	}
	return response, nil
}

func (s *Sqlite) Delete(cardId, id uint) error {
	if err := s.db.Where("card_id = ? AND id = ?", cardId, id).Delete(&Official{}).Error; err != nil {
		return err
	}

	return nil
}
