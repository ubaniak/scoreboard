package affiliations

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/affiliations/entities"
	"github.com/ubaniak/scoreboard/internal/affiliations/storage"
)

type Storage interface {
	Create(affiliation *entities.Affiliation) error
	List() ([]entities.Affiliation, error)
	ListByType(affiliationType entities.AffiliationType) ([]entities.Affiliation, error)
	Get(id uint) (*entities.Affiliation, error)
	FindByNameAndType(name string, affiliationType entities.AffiliationType) (*entities.Affiliation, error)
	Update(id uint, toUpdate *entities.UpdateAffiliation) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
