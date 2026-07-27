package roster

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/creation/roster/entities"
	"github.com/ubaniak/scoreboard/internal/creation/roster/storage"
)

type Storage interface {
	Add(cardID, athleteID uint) error
	Remove(cardID, athleteID uint) error
	SetAvailable(cardID, athleteID uint, available bool) error
	Get(cardID, athleteID uint) (*entities.RosterEntry, error)
	ListForCard(cardID uint) ([]entities.RosterEntry, error)
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
