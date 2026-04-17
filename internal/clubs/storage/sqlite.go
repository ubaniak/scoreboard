package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/clubs/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Club{}); err != nil {
		return nil, err
	}
	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Create(club *entities.Club) error {
	m := &Club{Name: club.Name, Location: club.Location}
	return s.db.Create(m).Error
}

func (s *Sqlite) List() ([]entities.Club, error) {
	var rows []Club
	if err := s.db.Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]entities.Club, len(rows))
	for i, r := range rows {
		result[i] = entities.Club{ID: r.ID, Name: r.Name, Location: r.Location, ImageUrl: r.ImageUrl}
	}
	return result, nil
}

func (s *Sqlite) Get(id uint) (*entities.Club, error) {
	var row Club
	if err := s.db.First(&row, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	return &entities.Club{ID: row.ID, Name: row.Name, Location: row.Location, ImageUrl: row.ImageUrl}, nil
}

func (s *Sqlite) SetImageUrl(id uint, url string) error {
	return s.db.Model(&Club{}).Where("id = ?", id).Update("image_url", url).Error
}

func (s *Sqlite) Update(id uint, toUpdate *entities.UpdateClub) error {
	var row Club
	if err := s.db.First(&row, id).Error; err != nil {
		return err
	}
	if toUpdate.Name != nil {
		row.Name = *toUpdate.Name
	}
	if toUpdate.Location != nil {
		row.Location = *toUpdate.Location
	}
	return s.db.Save(&row).Error
}

func (s *Sqlite) Delete(id uint) error {
	return s.db.Delete(&Club{}, id).Error
}
