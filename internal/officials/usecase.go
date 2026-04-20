package officials

import "github.com/ubaniak/scoreboard/internal/officials/entities"

type UseCase interface {
	Create(o *entities.Official) error
	CreateBulk(officials []*entities.Official) error
	Update(id uint, o *entities.Official) error
	Get() ([]entities.Official, error)
	Delete(id uint) error
	GetAffiliations() ([]entities.Official, error)
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(o *entities.Official) error {
	return uc.storage.Save(o)
}

func (uc *useCase) CreateBulk(officials []*entities.Official) error {
	for _, o := range officials {
		if err := uc.Create(o); err != nil {
			return err
		}
	}
	return nil
}

func (uc *useCase) Update(id uint, o *entities.Official) error {
	o.ID = id
	return uc.storage.Save(o)
}

func (uc *useCase) Get() ([]entities.Official, error) {
	return uc.storage.Get()
}

func (uc *useCase) Delete(id uint) error {
	return uc.storage.Delete(id)
}

func (uc *useCase) GetAffiliations() ([]entities.Official, error) {
	return uc.storage.Get()
}
