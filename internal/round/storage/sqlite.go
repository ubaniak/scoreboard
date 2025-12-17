package storage

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/round/entities"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Round{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Create(b *entities.Round) error {
	return nil
}
