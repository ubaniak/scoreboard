package cards

import "github.com/ubaniak/scoreboard/internal/cards/entities"

type UseCase interface {
	Create(name, date string) error
	Get() ([]entities.Card, error)
	GetById(id uint) (*entities.Card, error)
	UpdateSettings(id uint, settings *entities.Settings) error
	AddOfficial(id uint, name string) error
	GetOfficials(id uint) ([]entities.Official, error)
	DeleteOfficial(cardId, officialId uint) error
	UpdateOfficial(cardId, officialId uint, name string) error
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

func (uc *useCase) AddOfficial(id uint, name string) error {
	return uc.storage.AddOfficial(id, name)
}

func (uc *useCase) GetOfficials(id uint) ([]entities.Official, error) {
	return uc.storage.GetOfficials(id)
}

func (uc *useCase) DeleteOfficial(cardId, officialId uint) error {
	return uc.storage.DeleteOfficial(cardId, officialId)
}

func (uc *useCase) UpdateOfficial(cardId, officialId uint, name string) error {
	return uc.storage.UpdateOfficial(cardId, officialId, name)
}
