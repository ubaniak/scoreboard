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

func (s *Sqlite) Save(official *entities.Official) error {
	if official.ID == 0 {
		o := &Official{
			Name:               official.Name,
			Nationality:        official.Nationality,
			Gender:             official.Gender,
			YearOfBirth:        official.YearOfBirth,
			RegistrationNumber: official.RegistrationNumber,
			Province:           official.Province,
			Nation:             official.Nation,
		}
		return s.db.Create(o).Error
	}
	return s.db.Model(&Official{}).
		Where("id = ?", official.ID).
		Updates(map[string]interface{}{
			"name":                official.Name,
			"nationality":         official.Nationality,
			"gender":              official.Gender,
			"year_of_birth":       official.YearOfBirth,
			"registration_number": official.RegistrationNumber,
			"province":            official.Province,
			"nation":              official.Nation,
		}).Error
}

func (s *Sqlite) Get() ([]entities.Official, error) {
	var officials []Official
	var response []entities.Official
	if err := s.db.Find(&officials).Error; err != nil {
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
			Province:           o.Province,
			Nation:             o.Nation,
		}
		response = append(response, r)
	}
	return response, nil
}

func (s *Sqlite) Delete(id uint) error {
	if err := s.db.Where("id = ?", id).Delete(&Official{}).Error; err != nil {
		return err
	}

	return nil
}
