package cards

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/cards/storage"
)

type Storage interface {
	Create(c *entities.Card) error
	List() ([]entities.Card, error)
	Delete(id uint) error
	Update(id uint, toUpdate *entities.UpdateCard) error
	Get(id uint) (*entities.Card, error)
}

func NewCardStorage(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
