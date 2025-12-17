package round

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/round/entities"
	"github.com/ubaniak/scoreboard/internal/round/storage"
)

type Storage interface {
	Create(b *entities.Round) error
}

func NewStorage(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
