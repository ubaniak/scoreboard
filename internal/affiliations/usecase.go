package affiliations

import "github.com/ubaniak/scoreboard/internal/affiliations/entities"

type UseCase interface {
	Create(name string, affiliationType entities.AffiliationType) error
	FindOrCreate(name string, affiliationType entities.AffiliationType) (uint, error)
	FindOrCreateByName(name string) (uint, error) // convenience method for clubs
	FindOrCreateProvince(name string) (uint, error)
	FindOrCreateNation(name string) (uint, error)
	List() ([]entities.Affiliation, error)
	ListByType(affiliationType entities.AffiliationType) ([]entities.Affiliation, error)
	Get(id uint) (*entities.Affiliation, error)
	Update(id uint, toUpdate *entities.UpdateAffiliation) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

type useCaseImpl struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCaseImpl{storage: storage}
}

func (u *useCaseImpl) Create(name string, affiliationType entities.AffiliationType) error {
	return u.storage.Create(&entities.Affiliation{
		Name: name,
		Type: affiliationType,
	})
}

func (u *useCaseImpl) FindOrCreate(name string, affiliationType entities.AffiliationType) (uint, error) {
	existing, err := u.storage.FindByNameAndType(name, affiliationType)
	if err != nil {
		return 0, err
	}
	if existing != nil {
		return existing.ID, nil
	}
	aff := &entities.Affiliation{
		Name: name,
		Type: affiliationType,
	}
	if err := u.storage.Create(aff); err != nil {
		return 0, err
	}
	return aff.ID, nil
}

func (u *useCaseImpl) FindOrCreateByName(name string) (uint, error) {
	return u.FindOrCreate(name, entities.AffiliationTypeClub)
}

func (u *useCaseImpl) FindOrCreateProvince(name string) (uint, error) {
	return u.FindOrCreate(name, entities.AffiliationTypeProvince)
}

func (u *useCaseImpl) FindOrCreateNation(name string) (uint, error) {
	return u.FindOrCreate(name, entities.AffiliationTypeNation)
}

func (u *useCaseImpl) List() ([]entities.Affiliation, error) {
	return u.storage.List()
}

func (u *useCaseImpl) ListByType(affiliationType entities.AffiliationType) ([]entities.Affiliation, error) {
	return u.storage.ListByType(affiliationType)
}

func (u *useCaseImpl) Get(id uint) (*entities.Affiliation, error) {
	return u.storage.Get(id)
}

func (u *useCaseImpl) Update(id uint, toUpdate *entities.UpdateAffiliation) error {
	return u.storage.Update(id, toUpdate)
}

func (u *useCaseImpl) Delete(id uint) error {
	return u.storage.Delete(id)
}

func (u *useCaseImpl) SetImageUrl(id uint, url string) error {
	return u.storage.SetImageUrl(id, url)
}
