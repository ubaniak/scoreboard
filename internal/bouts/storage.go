package bouts

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/bouts/storage"
)

type Storage interface {
	Save(cardId uint, bout *entities.Bout) error
	Get(cardId uint) ([]*entities.Bout, error)
	Delete(cardId, id uint) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
