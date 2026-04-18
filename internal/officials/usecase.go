package officials

import "github.com/ubaniak/scoreboard/internal/officials/entities"

type UseCase interface {
	Create(cardId uint, o *entities.Official) error
	CreateBulk(cardId uint, names []string) error
	Update(cardId, id uint, o *entities.Official) error
	Get(cardId uint) ([]entities.Official, error)
	Delete(cardId, id uint) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(cardId uint, o *entities.Official) error {
	return uc.storage.Save(cardId, o)
}

func (uc *useCase) CreateBulk(cardId uint, names []string) error {
	for _, name := range names {
		if err := uc.Create(cardId, &entities.Official{Name: name}); err != nil {
			return err
		}
	}
	return nil
}

func (uc *useCase) Update(cardId, id uint, o *entities.Official) error {
	o.ID = id
	return uc.storage.Save(cardId, o)
}

func (uc *useCase) Get(cardId uint) ([]entities.Official, error) {
	return uc.storage.Get(cardId)
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
}
