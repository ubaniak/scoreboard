package clubs

import (
	"fmt"

	"github.com/ubaniak/scoreboard/internal/clubs/entities"
)

type UseCase interface {
	Create(name, location string) error
	FindOrCreateByName(name string) (uint, error)
	List() ([]entities.Club, error)
	Get(id uint) (*entities.Club, error)
	Update(id uint, toUpdate *entities.UpdateClub) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(name, location string) error {
	return uc.storage.Create(&entities.Club{Name: name, Location: location})
}

func (uc *useCase) List() ([]entities.Club, error) {
	return uc.storage.List()
}

func (uc *useCase) Get(id uint) (*entities.Club, error) {
	return uc.storage.Get(id)
}

func (uc *useCase) Update(id uint, toUpdate *entities.UpdateClub) error {
	return uc.storage.Update(id, toUpdate)
}

func (uc *useCase) Delete(id uint) error {
	return uc.storage.Delete(id)
}

func (uc *useCase) SetImageUrl(id uint, url string) error {
	return uc.storage.SetImageUrl(id, url)
}

func (uc *useCase) FindOrCreateByName(name string) (uint, error) {
	existing, err := uc.storage.FindByName(name)
	if err != nil {
		return 0, err
	}
	if existing != nil {
		return existing.ID, nil
	}
	if err := uc.storage.Create(&entities.Club{Name: name}); err != nil {
		return 0, err
	}
	created, err := uc.storage.FindByName(name)
	if err != nil || created == nil {
		return 0, fmt.Errorf("failed to retrieve newly created club %q", name)
	}
	return created.ID, nil
}
