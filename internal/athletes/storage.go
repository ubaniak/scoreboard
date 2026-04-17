package athletes

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/athletes/entities"
	"github.com/ubaniak/scoreboard/internal/athletes/storage"
)

type Storage interface {
	Create(athlete *entities.Athlete) error
	List() ([]entities.Athlete, error)
	Get(id uint) (*entities.Athlete, error)
	Update(id uint, toUpdate *entities.UpdateAthlete) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
