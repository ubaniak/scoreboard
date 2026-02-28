package scores

import (
	"github.com/ubaniak/scoreboard/internal/scores/entities"
	"github.com/ubaniak/scoreboard/internal/scores/storage"
	"gorm.io/gorm"
)

type Storage interface {
	Create(t *entities.Score) error
	Update(t *entities.Score) error
	List(cardId, boutId uint) ([]*entities.Score, error)
	Get(cardId, boutId uint, roundNumber int, judgeRole string) (*entities.Score, error)
}

func NewSqlite(db *gorm.DB) (Storage, error) {
	return storage.NewSqlite(db)
}
