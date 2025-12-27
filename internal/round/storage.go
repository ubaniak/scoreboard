package round

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/round/entities"
	"github.com/ubaniak/scoreboard/internal/round/storage"
)

type Storage interface {
	Create(b *entities.Round) error
	List(boutId uint) ([]*entities.Round, error)
	Update(boutId uint, roundNumber int, toUpdate entities.ToUpdate) error
	ListFouls() ([]string, error)
	AddFoul(foul *entities.RoundFoul) error
	GetFouls(boutId uint, roundNumber int) ([]*entities.RoundFoul, error)
	Get(boutId uint, roundNumber int) (*entities.Round, error)
}

func NewStorage(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
