package officials

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/officials/entities"
	"github.com/ubaniak/scoreboard/internal/officials/storage"
)

type Storage interface {
	Save(official *entities.Official) error
	Get() ([]entities.Official, error)
	FindByName(name string) (*entities.Official, error)
	Delete(id uint) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
