package bouts

import "github.com/ubaniak/scoreboard/internal/bouts/entities"

type UseCase interface {
	Create(cardId uint, bout *entities.Bout) error
	Update(cardId uint, bout *entities.Bout) error
	Get(cardId uint) ([]*entities.Bout, error)
	Delete(cardId, id uint) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(cardId uint, bout *entities.Bout) error {
	return uc.storage.Save(cardId, bout)
}

func (uc *useCase) Update(cardId uint, bout *entities.Bout) error {
	return uc.storage.Save(cardId, bout)
}

func (uc *useCase) Get(cardId uint) ([]*entities.Bout, error) {
	return uc.storage.Get(cardId)
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
}
