package clubs

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/clubs/entities"
	"github.com/ubaniak/scoreboard/internal/clubs/storage"
)

type Storage interface {
	Create(club *entities.Club) error
	List() ([]entities.Club, error)
	Get(id uint) (*entities.Club, error)
	Update(id uint, toUpdate *entities.UpdateClub) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
