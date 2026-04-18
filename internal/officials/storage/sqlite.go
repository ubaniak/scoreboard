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
	if official.ID == 0 {
		o := &Official{
			CardID:             cardId,
			Name:               official.Name,
			Nationality:        official.Nationality,
			Gender:             official.Gender,
			YearOfBirth:        official.YearOfBirth,
			RegistrationNumber: official.RegistrationNumber,
		}
		return s.db.Create(o).Error
	}
	return s.db.Model(&Official{}).
		Where("id = ? AND card_id = ?", official.ID, cardId).
		Updates(map[string]interface{}{
			"name":                official.Name,
			"nationality":         official.Nationality,
			"gender":              official.Gender,
			"year_of_birth":       official.YearOfBirth,
			"registration_number": official.RegistrationNumber,
		}).Error
}

func (s *Sqlite) Get(cardId uint) ([]entities.Official, error) {

	var officials []Official
	var response []entities.Official
	if err := s.db.Where("card_id = ?", cardId).Find(&officials).Error; err != nil {
		return []entities.Official{}, err
	}

	for _, o := range officials {
		r := entities.Official{
			ID:                 o.ID,
			Name:               o.Name,
			Nationality:        o.Nationality,
			Gender:             o.Gender,
			YearOfBirth:        o.YearOfBirth,
			RegistrationNumber: o.RegistrationNumber,
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
