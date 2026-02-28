package comment

import (
	"github.com/ubaniak/scoreboard/internal/comment/entities"
	"github.com/ubaniak/scoreboard/internal/comment/storage"
	"gorm.io/gorm"
)

type Storage interface {
	Add(entityKind string, entityId uint, comment string) error
	Get(entityKind string, entityId uint) ([]entities.Comment, error)
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
