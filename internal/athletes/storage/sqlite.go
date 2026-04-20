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

// ClubRow is a minimal struct for the club name lookup.
type ClubRow struct {
	ID       uint
	Name     string
	ImageUrl string
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Athlete{}); err != nil {
		return nil, err
	}
	return &Sqlite{db: db}, nil
}

func (s *Sqlite) resolveClubNames(athletes []Athlete) ([]entities.Athlete, error) {
	// Collect distinct club IDs
	clubIDSet := map[uint]struct{}{}
	for _, a := range athletes {
		if a.ClubID != nil {
			clubIDSet[*a.ClubID] = struct{}{}
		}
	}

	type clubInfo struct {
		name     string
		imageUrl string
	}
	clubs := map[uint]clubInfo{}
	if len(clubIDSet) > 0 {
		ids := make([]uint, 0, len(clubIDSet))
		for id := range clubIDSet {
			ids = append(ids, id)
		}
		var rows []ClubRow
		if err := s.db.Table("clubs").Select("id, name, image_url").Where("id IN ? AND deleted_at IS NULL", ids).Find(&rows).Error; err == nil {
			for _, r := range rows {
				clubs[r.ID] = clubInfo{name: r.Name, imageUrl: r.ImageUrl}
			}
		}
	}

	result := make([]entities.Athlete, len(athletes))
	for i, a := range athletes {
		e := entities.Athlete{
			ID:               a.ID,
			Name:             a.Name,
			DateOfBirth:      a.DateOfBirth,
			Nationality:      a.Nationality,
			ClubID:           a.ClubID,
			ProvinceName:     a.ProvinceName,
			ProvinceImageUrl: a.ProvinceImageUrl,
			NationName:       a.NationName,
			NationImageUrl:   a.NationImageUrl,
			ImageUrl:         a.ImageUrl,
		}
		if a.ClubID != nil {
			if info, ok := clubs[*a.ClubID]; ok {
				e.ClubName = info.name
				e.ClubImageUrl = info.imageUrl
			}
		}
		result[i] = e
	}
	return result, nil
}

func (s *Sqlite) Create(athlete *entities.Athlete) error {
	m := &Athlete{
		Name:             athlete.Name,
		DateOfBirth:      athlete.DateOfBirth,
		Nationality:      athlete.Nationality,
		ClubID:           athlete.ClubID,
		ProvinceName:     athlete.ProvinceName,
		ProvinceImageUrl: athlete.ProvinceImageUrl,
		NationName:       athlete.NationName,
		NationImageUrl:   athlete.NationImageUrl,
	}
	return s.db.Create(m).Error
}

func (s *Sqlite) FindByName(name string) ([]entities.Athlete, error) {
	var rows []Athlete
	if err := s.db.Where("LOWER(name) = LOWER(?)", name).Find(&rows).Error; err != nil {
		return nil, err
	}
	return s.resolveClubNames(rows)
}

func (s *Sqlite) List() ([]entities.Athlete, error) {
	var rows []Athlete
	if err := s.db.Find(&rows).Error; err != nil {
		return nil, err
	}
	return s.resolveClubNames(rows)
}

func (s *Sqlite) Get(id uint) (*entities.Athlete, error) {
	var row Athlete
	if err := s.db.First(&row, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	results, err := s.resolveClubNames([]Athlete{row})
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
	if toUpdate.DateOfBirth != nil {
		row.DateOfBirth = *toUpdate.DateOfBirth
	}
	if toUpdate.Nationality != nil {
		row.Nationality = *toUpdate.Nationality
	}
	if toUpdate.ClubID != nil {
		row.ClubID = *toUpdate.ClubID
	}
	if toUpdate.ProvinceName != nil {
		row.ProvinceName = *toUpdate.ProvinceName
	}
	if toUpdate.ProvinceImageUrl != nil {
		row.ProvinceImageUrl = *toUpdate.ProvinceImageUrl
	}
	if toUpdate.NationName != nil {
		row.NationName = *toUpdate.NationName
	}
	if toUpdate.NationImageUrl != nil {
		row.NationImageUrl = *toUpdate.NationImageUrl
	}
	return s.db.Save(&row).Error
}

func (s *Sqlite) Delete(id uint) error {
	return s.db.Delete(&Athlete{}, id).Error
}

func (s *Sqlite) SetImageUrl(id uint, url string) error {
	return s.db.Model(&Athlete{}).Where("id = ?", id).Update("image_url", url).Error
}
