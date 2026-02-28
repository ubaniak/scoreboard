package storage

import (
	"github.com/ubaniak/scoreboard/internal/comment/entities"
	"gorm.io/gorm"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Comment{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Add(entityKind string, entityId uint, comment string) error {
	c := &Comment{
		Comment:    comment,
		EntityKind: entityKind,
		EntityID:   entityId,
	}

	if err := s.db.Save(c).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) Get(entityKind string, entityId uint) ([]entities.Comment, error) {

	var comments []Comment
	if err := s.db.Where("entityKind = ? AND entityId = ?", entityKind, entityId).Find(&comments).Error; err != nil {
		return nil, err
	}

	var result = make([]entities.Comment, len(comments))

	for i, comment := range comments {
		result[i] = entities.Comment{Comment: comment.Comment}
	}

	return result, nil
}
