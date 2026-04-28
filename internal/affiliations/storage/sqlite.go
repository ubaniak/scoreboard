package storage

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/affiliations/entities"
	"gorm.io/gorm"
)

type SqliteStorage struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*SqliteStorage, error) {
	if err := db.AutoMigrate(&Affiliation{}); err != nil {
		return nil, err
	}
	return &SqliteStorage{db: db}, nil
}

func (s *SqliteStorage) Create(a *entities.Affiliation) error {
	model := &Affiliation{
		Name:     a.Name,
		Type:     string(a.Type),
		ImageUrl: a.ImageUrl,
	}
	if err := s.db.Create(model).Error; err != nil {
		return err
	}
	a.ID = model.ID
	return nil
}

func (s *SqliteStorage) List() ([]entities.Affiliation, error) {
	var models []Affiliation
	if err := s.db.Where("deleted_at IS NULL").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]entities.Affiliation, len(models))
	for i, m := range models {
		result[i] = entities.Affiliation{
			ID:       m.ID,
			Name:     m.Name,
			Type:     entities.AffiliationType(m.Type),
			ImageUrl: m.ImageUrl,
		}
	}
	return result, nil
}

func (s *SqliteStorage) ListByType(affiliationType entities.AffiliationType) ([]entities.Affiliation, error) {
	var models []Affiliation
	if err := s.db.Where("type = ? AND deleted_at IS NULL", string(affiliationType)).Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]entities.Affiliation, len(models))
	for i, m := range models {
		result[i] = entities.Affiliation{
			ID:       m.ID,
			Name:     m.Name,
			Type:     entities.AffiliationType(m.Type),
			ImageUrl: m.ImageUrl,
		}
	}
	return result, nil
}

func (s *SqliteStorage) Get(id uint) (*entities.Affiliation, error) {
	var model Affiliation
	if err := s.db.Where("deleted_at IS NULL").First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entities.Affiliation{
		ID:       model.ID,
		Name:     model.Name,
		Type:     entities.AffiliationType(model.Type),
		ImageUrl: model.ImageUrl,
	}, nil
}

func (s *SqliteStorage) FindByNameAndType(name string, affiliationType entities.AffiliationType) (*entities.Affiliation, error) {
	var model Affiliation
	if err := s.db.Where("name = ? AND type = ? AND deleted_at IS NULL", name, string(affiliationType)).First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entities.Affiliation{
		ID:       model.ID,
		Name:     model.Name,
		Type:     entities.AffiliationType(model.Type),
		ImageUrl: model.ImageUrl,
	}, nil
}

func (s *SqliteStorage) Update(id uint, toUpdate *entities.UpdateAffiliation) error {
	updates := map[string]interface{}{}
	if toUpdate.Name != nil {
		updates["name"] = *toUpdate.Name
	}
	if toUpdate.Type != nil {
		updates["type"] = string(*toUpdate.Type)
	}
	if len(updates) == 0 {
		return nil
	}
	return s.db.Model(&Affiliation{}).Where("id = ?", id).Updates(updates).Error
}

func (s *SqliteStorage) Delete(id uint) error {
	return s.db.Delete(&Affiliation{}, id).Error
}

func (s *SqliteStorage) SetImageUrl(id uint, url string) error {
	return s.db.Model(&Affiliation{}).Where("id = ?", id).Update("image_url", url).Error
}
