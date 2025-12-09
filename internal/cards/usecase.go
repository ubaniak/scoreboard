package cards

import (
	"github.com/ubaniak/scoreboard/internal/cards/entities"
)

type UseCase interface {
	Create(name, date string) error
	Get() ([]entities.Card, error)
	GetById(id uint) (*entities.Card, error)
	UpdateSettings(id uint, settings *entities.Settings) error
	// AddOfficial(id uint, name string) error
	// GetOfficials(id uint) ([]entities.Official, error)
	// DeleteOfficial(cardId, officialId uint) error
	// UpdateOfficial(cardId, officialId uint, name string) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(name, date string) error {
	return uc.storage.Create(name, date)
}

func (uc *useCase) Get() ([]entities.Card, error) {
	return uc.storage.Get()
}

func (uc *useCase) GetById(id uint) (*entities.Card, error) {
	return uc.storage.GetByID(id)
}

func (uc *useCase) UpdateSettings(id uint, settings *entities.Settings) error {
	return uc.storage.UpdateSettings(id, settings)
}
