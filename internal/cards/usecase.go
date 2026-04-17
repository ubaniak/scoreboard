package cards

import (
	"github.com/ubaniak/scoreboard/internal/cards/entities"
)

type UseCase interface {
	Create(name, date string) error
	Update(id uint, toUpdate *entities.UpdateCard) error
	List() ([]entities.Card, error)
	Delete(id uint) error
	Get(id uint) (*entities.Card, error)
	Current() (*entities.Card, error)
	SetImageUrl(id uint, url string) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(name, date string) error {
	card := &entities.Card{
		Name:   name,
		Date:   date,
		Status: entities.CardStatusUpComing,
	}
	return uc.storage.Create(card)
}

func (uc *useCase) Update(id uint, toUpdate *entities.UpdateCard) error {
	return uc.storage.Update(id, toUpdate)
}

func (uc *useCase) List() ([]entities.Card, error) {
	return uc.storage.List()
}

func (uc *useCase) Current() (*entities.Card, error) {
	return uc.storage.Current()
}

func (uc *useCase) Get(id uint) (*entities.Card, error) {
	return uc.storage.Get(id)
}

func (uc *useCase) Delete(id uint) error {
	return uc.storage.Delete(id)
}

func (uc *useCase) SetImageUrl(id uint, url string) error {
	return uc.storage.SetImageUrl(id, url)
}
