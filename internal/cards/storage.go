package cards

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/cards/storage"
)

type Storage interface {
	Create(name, date string) error
	Get() ([]entities.Card, error)
	GetByID(id uint) (*entities.Card, error)
	UpdateSettings(id uint, settings *entities.Settings) error
	AddOfficial(id uint, name string) error
	GetOfficials(id uint) ([]entities.Official, error)
	DeleteOfficial(cardId, officialId uint) error
	UpdateOfficial(cardId, officialId uint, name string) error
}

func NewCardStorage(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
