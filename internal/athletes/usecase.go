package athletes

import (
	"errors"
	"fmt"
	"strings"

	"github.com/ubaniak/scoreboard/internal/athletes/entities"
)

// ErrInvalidAgeCategory is returned when an athlete would be saved without a
// valid age category. Every athlete needs one: bouts are built from it.
var ErrInvalidAgeCategory = errors.New("invalid ageCategory")

var validAgeCategories = map[string]bool{
	"u13": true, "u15": true, "u17": true, "u19": true, "elite": true, "masters": true,
}

func checkAgeCategory(ageCategory string) error {
	if !validAgeCategories[ageCategory] {
		return fmt.Errorf("%w %q", ErrInvalidAgeCategory, ageCategory)
	}
	return nil
}

type UseCase interface {
	Create(name, ageCategory, gender, experience string, clubAffiliationID, provinceAffiliationID, nationAffiliationID *uint, weightClass *float64) (uint, error)
	FindOrCreateByName(name, clubName, ageCategory string) (uint, error)
	FindOrCreateByNameAndClub(name, ageCategory string, clubAffiliationID *uint) (uint, error)
	FindOrCreateByNameClubProvince(name, ageCategory string, clubAffiliationID, provinceAffiliationID *uint) (uint, error)
	FindOrCreateFull(name, ageCategory, gender, experience string, clubAffiliationID, provinceAffiliationID, nationAffiliationID *uint, weightClass *float64) (uint, error)
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

func (uc *useCase) FindOrCreateByNameAndClub(name, ageCategory string, clubAffiliationID *uint) (uint, error) {
	matches, err := uc.storage.FindByName(name)
	if err != nil {
		return 0, err
	}
	if len(matches) > 0 {
		return matches[0].ID, nil
	}
	if err := checkAgeCategory(ageCategory); err != nil {
		return 0, err
	}
	return uc.storage.Create(&entities.Athlete{Name: name, AgeCategory: ageCategory, ClubAffiliationID: clubAffiliationID})
}

func (uc *useCase) FindOrCreateByNameClubProvince(name, ageCategory string, clubAffiliationID, provinceAffiliationID *uint) (uint, error) {
	matches, err := uc.storage.FindByName(name)
	if err != nil {
		return 0, err
	}
	if len(matches) > 0 {
		existing := matches[0]
		upd := &entities.UpdateAthlete{}
		if clubAffiliationID != nil {
			cid := clubAffiliationID
			upd.ClubAffiliationID = &cid
		}
		if provinceAffiliationID != nil {
			pid := provinceAffiliationID
			upd.ProvinceAffiliationID = &pid
		}
		if upd.ClubAffiliationID != nil || upd.ProvinceAffiliationID != nil {
			if err := uc.storage.Update(existing.ID, upd); err != nil {
				return 0, err
			}
		}
		return existing.ID, nil
	}
	return uc.storage.Create(&entities.Athlete{
		Name:                  name,
		ClubAffiliationID:     clubAffiliationID,
		ProvinceAffiliationID: provinceAffiliationID,
	})
}

func (uc *useCase) FindOrCreateFull(name, ageCategory, gender, experience string, clubAffiliationID, provinceAffiliationID, nationAffiliationID *uint, weightClass *float64) (uint, error) {
	matches, err := uc.storage.FindByName(name)
	if err != nil {
		return 0, err
	}
	if len(matches) > 0 {
		existing := matches[0]
		upd := &entities.UpdateAthlete{}
		if ageCategory != "" {
			upd.AgeCategory = &ageCategory
		}
		if gender != "" {
			upd.Gender = &gender
		}
		if experience != "" {
			upd.Experience = &experience
		}
		if clubAffiliationID != nil {
			cid := clubAffiliationID
			upd.ClubAffiliationID = &cid
		}
		if provinceAffiliationID != nil {
			pid := provinceAffiliationID
			upd.ProvinceAffiliationID = &pid
		}
		if nationAffiliationID != nil {
			nid := nationAffiliationID
			upd.NationAffiliationID = &nid
		}
		if weightClass != nil {
			wc := weightClass
			upd.WeightClass = &wc
		}
		if upd.AgeCategory != nil || upd.Gender != nil || upd.Experience != nil ||
			upd.ClubAffiliationID != nil || upd.ProvinceAffiliationID != nil || upd.NationAffiliationID != nil ||
			upd.WeightClass != nil {
			if err := uc.storage.Update(existing.ID, upd); err != nil {
				return 0, err
			}
		}
		return existing.ID, nil
	}
	if err := checkAgeCategory(ageCategory); err != nil {
		return 0, err
	}
	return uc.storage.Create(&entities.Athlete{
		Name:                  name,
		AgeCategory:           ageCategory,
		Gender:                gender,
		Experience:            experience,
		ClubAffiliationID:     clubAffiliationID,
		ProvinceAffiliationID: provinceAffiliationID,
		NationAffiliationID:   nationAffiliationID,
		WeightClass:           weightClass,
	})
}

func (uc *useCase) FindOrCreateByName(name, clubName, ageCategory string) (uint, error) {
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
	// Not found — create a new athlete with the name and the bout's age category.
	if err := checkAgeCategory(ageCategory); err != nil {
		return 0, err
	}
	return uc.storage.Create(&entities.Athlete{Name: name, AgeCategory: ageCategory})
}

func (uc *useCase) Create(name, ageCategory, gender, experience string, clubAffiliationID, provinceAffiliationID, nationAffiliationID *uint, weightClass *float64) (uint, error) {
	if err := checkAgeCategory(ageCategory); err != nil {
		return 0, err
	}
	return uc.storage.Create(&entities.Athlete{
		Name:                  name,
		AgeCategory:           ageCategory,
		Gender:                gender,
		Experience:            experience,
		ClubAffiliationID:     clubAffiliationID,
		ProvinceAffiliationID: provinceAffiliationID,
		NationAffiliationID:   nationAffiliationID,
		WeightClass:           weightClass,
	})
}

func (uc *useCase) List() ([]entities.Athlete, error) {
	return uc.storage.List()
}

func (uc *useCase) Get(id uint) (*entities.Athlete, error) {
	return uc.storage.Get(id)
}

func (uc *useCase) Update(id uint, toUpdate *entities.UpdateAthlete) error {
	if toUpdate.AgeCategory != nil {
		if err := checkAgeCategory(*toUpdate.AgeCategory); err != nil {
			return err
		}
	}
	return uc.storage.Update(id, toUpdate)
}

func (uc *useCase) Delete(id uint) error {
	return uc.storage.Delete(id)
}

func (uc *useCase) SetImageUrl(id uint, url string) error {
	return uc.storage.SetImageUrl(id, url)
}
