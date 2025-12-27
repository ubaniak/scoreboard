package bouts

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/bouts/storage"
)

type Storage interface {
	Save(cardId uint, bout *entities.Bout) (uint, error)
	List(cardId uint) ([]*entities.Bout, error)
	Get(cardId, id uint) (*entities.Bout, error)
	Delete(cardId, id uint) error
	Update(cardId, id uint, bout *entities.UpdateBout) error
	SetStatus(cardId, id uint, status entities.BoutStatus) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
