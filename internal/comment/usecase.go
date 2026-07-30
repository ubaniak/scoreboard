package comment

import "github.com/ubaniak/scoreboard/internal/comment/entities"

type UseCase interface {
	Add(entityKind string, entityId uint, comment string) (uint, error)
	Get(entityKind string, entityId uint) ([]entities.Comment, error)
	Update(entityKind string, entityId, id uint, comment string) error
	Delete(entityKind string, entityId, id uint) error
}

type usecase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &usecase{storage: storage}
}

func (u *usecase) Add(entityKind string, entityId uint, comment string) (uint, error) {
	return u.storage.Add(entityKind, entityId, comment)
}

func (u *usecase) Get(entityKind string, entityId uint) ([]entities.Comment, error) {
	return u.storage.Get(entityKind, entityId)
}

func (u *usecase) Update(entityKind string, entityId, id uint, comment string) error {
	return u.storage.Update(entityKind, entityId, id, comment)
}

func (u *usecase) Delete(entityKind string, entityId, id uint) error {
	return u.storage.Delete(entityKind, entityId, id)
}
