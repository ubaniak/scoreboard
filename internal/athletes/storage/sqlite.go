package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/athletes/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

// AffiliationRow is a minimal struct for affiliation name lookup.
type AffiliationRow struct {
	ID       uint
	Name     string
	ImageUrl string
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Athlete{}); err != nil {
		return nil, err
	}
	// Rename date_of_birth → age_category for existing databases
	if db.Migrator().HasColumn(&Athlete{}, "date_of_birth") {
		if err := db.Migrator().RenameColumn(&Athlete{}, "date_of_birth", "age_category"); err != nil {
			return nil, err
		}
	}
	return &Sqlite{db: db}, nil
}

func (s *Sqlite) resolveAffiliationNames(athletes []Athlete) ([]entities.Athlete, error) {
	// Collect distinct affiliation IDs
	affiliationIDSet := map[uint]struct{}{}
	for _, a := range athletes {
		if a.ClubAffiliationID != nil {
			affiliationIDSet[*a.ClubAffiliationID] = struct{}{}
		}
		if a.ProvinceAffiliationID != nil {
			affiliationIDSet[*a.ProvinceAffiliationID] = struct{}{}
		}
		if a.NationAffiliationID != nil {
			affiliationIDSet[*a.NationAffiliationID] = struct{}{}
		}
	}

	type affiliationInfo struct {
		name     string
		imageUrl string
	}
	affiliations := map[uint]affiliationInfo{}
	if len(affiliationIDSet) > 0 {
		ids := make([]uint, 0, len(affiliationIDSet))
		for id := range affiliationIDSet {
			ids = append(ids, id)
		}
		var rows []AffiliationRow
		if err := s.db.Table("affiliations").Select("id, name, image_url").Where("id IN ? AND deleted_at IS NULL", ids).Find(&rows).Error; err == nil {
			for _, r := range rows {
				affiliations[r.ID] = affiliationInfo{name: r.Name, imageUrl: r.ImageUrl}
			}
		}
	}

	result := make([]entities.Athlete, len(athletes))
	for i, a := range athletes {
		e := entities.Athlete{
			ID:                    a.ID,
			Name:                  a.Name,
			AgeCategory:           a.AgeCategory,
			Gender:                a.Gender,
			Experience:            a.Experience,
			ClubAffiliationID:     a.ClubAffiliationID,
			ProvinceAffiliationID: a.ProvinceAffiliationID,
			NationAffiliationID:   a.NationAffiliationID,
			ImageUrl:              a.ImageUrl,
		}
		if a.ClubAffiliationID != nil {
			if info, ok := affiliations[*a.ClubAffiliationID]; ok {
				e.ClubName = info.name
				e.ClubImageUrl = info.imageUrl
			}
		}
		if a.ProvinceAffiliationID != nil {
			if info, ok := affiliations[*a.ProvinceAffiliationID]; ok {
				e.ProvinceName = info.name
				e.ProvinceImageUrl = info.imageUrl
			}
		}
		if a.NationAffiliationID != nil {
			if info, ok := affiliations[*a.NationAffiliationID]; ok {
				e.NationName = info.name
				e.NationImageUrl = info.imageUrl
			}
		}
		result[i] = e
	}
	return result, nil
}

func (s *Sqlite) Create(athlete *entities.Athlete) error {
	m := &Athlete{
		Name:                  athlete.Name,
		AgeCategory:           athlete.AgeCategory,
		Gender:                athlete.Gender,
		Experience:            athlete.Experience,
		ClubAffiliationID:     athlete.ClubAffiliationID,
		ProvinceAffiliationID: athlete.ProvinceAffiliationID,
		NationAffiliationID:   athlete.NationAffiliationID,
	}
	return s.db.Create(m).Error
}

func (s *Sqlite) FindByName(name string) ([]entities.Athlete, error) {
	var rows []Athlete
	if err := s.db.Where("LOWER(name) = LOWER(?)", name).Find(&rows).Error; err != nil {
		return nil, err
	}
	return s.resolveAffiliationNames(rows)
}

func (s *Sqlite) List() ([]entities.Athlete, error) {
	var rows []Athlete
	if err := s.db.Find(&rows).Error; err != nil {
		return nil, err
	}
	return s.resolveAffiliationNames(rows)
}

func (s *Sqlite) Get(id uint) (*entities.Athlete, error) {
	var row Athlete
	if err := s.db.First(&row, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	results, err := s.resolveAffiliationNames([]Athlete{row})
	if err != nil || len(results) == 0 {
		return nil, err
	}
	return &results[0], nil
}

func (s *Sqlite) Update(id uint, toUpdate *entities.UpdateAthlete) error {
	var row Athlete
	if err := s.db.First(&row, id).Error; err != nil {
		return err
	}
	if toUpdate.Name != nil {
		row.Name = *toUpdate.Name
	}
	if toUpdate.AgeCategory != nil {
		row.AgeCategory = *toUpdate.AgeCategory
	}
	if toUpdate.Gender != nil {
		row.Gender = *toUpdate.Gender
	}
	if toUpdate.Experience != nil {
		row.Experience = *toUpdate.Experience
	}
	if toUpdate.ClubAffiliationID != nil {
		row.ClubAffiliationID = *toUpdate.ClubAffiliationID
	}
	if toUpdate.ProvinceAffiliationID != nil {
		row.ProvinceAffiliationID = *toUpdate.ProvinceAffiliationID
	}
	if toUpdate.NationAffiliationID != nil {
		row.NationAffiliationID = *toUpdate.NationAffiliationID
	}
	return s.db.Save(&row).Error
}

func (s *Sqlite) Delete(id uint) error {
	return s.db.Delete(&Athlete{}, id).Error
}

func (s *Sqlite) SetImageUrl(id uint, url string) error {
	return s.db.Model(&Athlete{}).Where("id = ?", id).Update("image_url", url).Error
}
