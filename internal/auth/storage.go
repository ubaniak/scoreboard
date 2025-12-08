package auth

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/auth/entities"
	"github.com/ubaniak/scoreboard/internal/auth/storage"
)

//go:generate mockgen -source=storage.go -destination=./mocks/mock_storage.go -package=mocks
type Storage interface {
	Save(entities.Profile) error
	Get(role string) (entities.Profile, error)
	GetByToken(jwtToken string) (*entities.Profile, error)
}

func NewAuthStorage(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
