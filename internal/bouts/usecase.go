package bouts

import "github.com/ubaniak/scoreboard/internal/bouts/entities"

type UseCase interface {
	Create(cardId uint, bout *entities.Bout) error
	Update(cardId, id uint, bout *entities.UpdateBout) error
	List(cardId uint) ([]*entities.Bout, error)
	Get(cardId, boutId uint) (*entities.Bout, error)
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

func (uc *useCase) Update(cardId, id uint, bout *entities.UpdateBout) error {
	return uc.storage.Update(cardId, id, bout)
}

func (uc *useCase) List(cardId uint) ([]*entities.Bout, error) {
	return uc.storage.List(cardId)
}

func (uc *useCase) Get(cardId, boutId uint) (*entities.Bout, error) {
	return uc.storage.Get(cardId, boutId)
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
}
