package comment

import "github.com/ubaniak/scoreboard/internal/comment/entities"

type UseCase interface {
	Add(entityKind string, entityId uint, comment string) error
	Get(entityKind string, entityId uint) ([]entities.Comment, error)
}

type usecase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &usecase{storage: storage}
}

func (u *usecase) Add(entityKind string, entityId uint, comment string) error {
	return u.storage.Add(entityKind, entityId, comment)
}

func (u *usecase) Get(entityKind string, entityId uint) ([]entities.Comment, error) {
	return u.storage.Get(entityKind, entityId)
}
