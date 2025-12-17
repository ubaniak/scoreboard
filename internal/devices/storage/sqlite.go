// keep as a model for all storages
package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/devices/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&StatusProfile{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Save(p *entities.StatusProfile) error {
	m := EntityToModel(p)
	if err := s.db.Save(m).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) Get(role string) (*entities.StatusProfile, error) {
	var profile StatusProfile
	if err := s.db.Where("role = ?", role).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	e := ModelToEntity(&profile)
	return e, nil
}

func (s *Sqlite) List() ([]entities.StatusProfile, error) {
	var profiles []StatusProfile
	if err := s.db.Find(&profiles).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []entities.StatusProfile{}, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	result := make([]entities.StatusProfile, len(profiles))
	for i, p := range profiles {
		result[i] = *ModelToEntity(&p)
	}
	return result, nil
}

func (s *Sqlite) Update(role string, p *entities.StatusProfile) error {
	var profile StatusProfile
	if err := s.db.Where("role = ?", role).First(&profile).Error; err != nil {
		return err
	}

	profile.Status = string(p.Status)

	if err := s.db.Save(profile).Error; err != nil {
		return err
	}
	return nil
}
