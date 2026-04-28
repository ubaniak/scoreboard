package athletes

import (
	"fmt"
	"strings"

	"github.com/ubaniak/scoreboard/internal/athletes/entities"
)

type UseCase interface {
	Create(name, ageCategory, nationality string, clubAffiliationID, provinceAffiliationID, nationAffiliationID *uint) error
	FindOrCreateByName(name, clubName string) (uint, error)
	FindOrCreateByNameAndClub(name string, clubAffiliationID *uint) (uint, error)
	List() ([]entities.Athlete, error)
	Get(id uint) (*entities.Athlete, error)
	Update(id uint, toUpdate *entities.UpdateAthlete) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) FindOrCreateByNameAndClub(name string, clubAffiliationID *uint) (uint, error) {
	matches, err := uc.storage.FindByName(name)
	if err != nil {
		return 0, err
	}
	if len(matches) > 0 {
		return matches[0].ID, nil
	}
	if err := uc.storage.Create(&entities.Athlete{Name: name, ClubAffiliationID: clubAffiliationID}); err != nil {
		return 0, err
	}
	created, err := uc.storage.FindByName(name)
	if err != nil || len(created) == 0 {
		return 0, fmt.Errorf("failed to retrieve newly created athlete %q", name)
	}
	return created[len(created)-1].ID, nil
}

func (uc *useCase) FindOrCreateByName(name, clubName string) (uint, error) {
	matches, err := uc.storage.FindByName(name)
	if err != nil {
		return 0, err
	}
	// Prefer exact club name match when multiple athletes share a name.
	if len(matches) > 1 && clubName != "" {
		for _, a := range matches {
			if strings.EqualFold(a.ClubName, clubName) {
				return a.ID, nil
			}
		}
	}
	if len(matches) > 0 {
		return matches[0].ID, nil
	}
	// Not found — create a new athlete with just the name.
	if err := uc.storage.Create(&entities.Athlete{Name: name}); err != nil {
		return 0, err
	}
	created, err := uc.storage.FindByName(name)
	if err != nil || len(created) == 0 {
		return 0, fmt.Errorf("failed to retrieve newly created athlete %q", name)
	}
	return created[len(created)-1].ID, nil
}

func (uc *useCase) Create(name, ageCategory, nationality string, clubAffiliationID, provinceAffiliationID, nationAffiliationID *uint) error {
	return uc.storage.Create(&entities.Athlete{
		Name:                  name,
		AgeCategory:           ageCategory,
		Nationality:           nationality,
		ClubAffiliationID:     clubAffiliationID,
		ProvinceAffiliationID: provinceAffiliationID,
		NationAffiliationID:   nationAffiliationID,
	})
}

func (uc *useCase) List() ([]entities.Athlete, error) {
	return uc.storage.List()
}

func (uc *useCase) Get(id uint) (*entities.Athlete, error) {
	return uc.storage.Get(id)
}

func (uc *useCase) Update(id uint, toUpdate *entities.UpdateAthlete) error {
	return uc.storage.Update(id, toUpdate)
}

func (uc *useCase) Delete(id uint) error {
	return uc.storage.Delete(id)
}

func (uc *useCase) SetImageUrl(id uint, url string) error {
	return uc.storage.SetImageUrl(id, url)
}
