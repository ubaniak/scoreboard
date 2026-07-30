package comment

import (
	"github.com/ubaniak/scoreboard/internal/comment/entities"
	"github.com/ubaniak/scoreboard/internal/comment/storage"
	"gorm.io/gorm"
)

type Storage interface {
	Add(entityKind string, entityId uint, comment string) (uint, error)
	Get(entityKind string, entityId uint) ([]entities.Comment, error)
	Update(entityKind string, entityId, id uint, comment string) error
	Delete(entityKind string, entityId, id uint) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
