package officials

import "github.com/ubaniak/scoreboard/internal/officials/entities"

type UseCase interface {
	Create(cardId uint, name string) error
	Update(cardId, id uint, name string) error
	Get(cardId uint) ([]entities.Official, error)
	Delete(cardId, id uint) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(cardId uint, name string) error {
	o := &entities.Official{
		Name: name,
	}
	return uc.storage.Save(cardId, o)
}

func (uc *useCase) Update(cardId, id uint, name string) error {
	o := &entities.Official{
		ID:   id,
		Name: name,
	}
	return uc.storage.Save(cardId, o)
}

func (uc *useCase) Get(cardId uint) ([]entities.Official, error) {
	return uc.storage.Get(cardId)
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
}
