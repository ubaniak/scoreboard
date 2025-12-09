package officials

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/officials/entities"
	"github.com/ubaniak/scoreboard/internal/officials/storage"
)

type Storage interface {
	Save(cardId uint, official *entities.Official) error
	Get(cardId uint) ([]entities.Official, error)
	Delete(cardId, id uint) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
