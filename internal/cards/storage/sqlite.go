package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/cards/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Card{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Create(c *entities.Card) error {
	numJudges := c.NumberOfJudges
	if numJudges == 0 {
		numJudges = 5
	}
	card := &Card{
		Name:           c.Name,
		Date:           c.Date,
		Status:         string(c.Status),
		NumberOfJudges: numJudges,
	}

	if err := s.db.Create(card).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) List() ([]entities.Card, error) {
	var cards []Card
	if err := s.db.Find(&cards).Error; err != nil {
		return nil, err
	}

	var result []entities.Card
	for _, c := range cards {
		numJudges := c.NumberOfJudges
		if numJudges == 0 {
			numJudges = 5
		}
		result = append(result, entities.Card{
			ID:                      c.ID,
			Name:                    c.Name,
			Date:                    c.Date,
			Status:                  entities.CardStatus(c.Status),
			NumberOfJudges:          numJudges,
			ImageUrl:                c.ImageUrl,
			ShowCardImage:           c.ShowCardImage,
			ShowAthleteImages:       c.ShowAthleteImages,
			ShowClubImages:          c.ShowClubImages,
			ShowOfficialAffiliation: c.ShowOfficialAffiliation,
			ShowAthleteAffiliation:  c.ShowAthleteAffiliation,
		})
	}
	return result, nil
}

func (s *Sqlite) FindByName(name string) (*entities.Card, error) {
	var card Card
	if err := s.db.Where("LOWER(name) = LOWER(?)", name).First(&card).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	numJudges := card.NumberOfJudges
	if numJudges == 0 {
		numJudges = 5
	}
	return &entities.Card{
		ID:             card.ID,
		Name:           card.Name,
		Date:           card.Date,
		Status:         entities.CardStatus(card.Status),
		NumberOfJudges: numJudges,
		ImageUrl:       card.ImageUrl,
	}, nil
}

func (s *Sqlite) Current() (*entities.Card, error) {
	var card Card
	if err := s.db.Where("status = ?", entities.CardStatusInProgress).First(&card).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}

	numJudges := card.NumberOfJudges
	if numJudges == 0 {
		numJudges = 5
	}
	var result = &entities.Card{
		ID:                      card.ID,
		Name:                    card.Name,
		Date:                    card.Date,
		Status:                  entities.CardStatus(card.Status),
		NumberOfJudges:          numJudges,
		ImageUrl:                card.ImageUrl,
		ShowCardImage:           card.ShowCardImage,
		ShowAthleteImages:       card.ShowAthleteImages,
		ShowClubImages:          card.ShowClubImages,
		ShowOfficialAffiliation: card.ShowOfficialAffiliation,
		ShowAthleteAffiliation:  card.ShowAthleteAffiliation,
	}
	return result, nil
}

func (s *Sqlite) Get(id uint) (*entities.Card, error) {
	var card Card
	if err := s.db.First(&card, id).Error; err != nil {
		return nil, err
	}
	numJudges := card.NumberOfJudges
	if numJudges == 0 {
		numJudges = 5
	}
	var result = &entities.Card{
		ID:                      card.ID,
		Name:                    card.Name,
		Date:                    card.Date,
		Status:                  entities.CardStatus(card.Status),
		NumberOfJudges:          numJudges,
		ImageUrl:                card.ImageUrl,
		ShowCardImage:           card.ShowCardImage,
		ShowAthleteImages:       card.ShowAthleteImages,
		ShowClubImages:          card.ShowClubImages,
		ShowOfficialAffiliation: card.ShowOfficialAffiliation,
		ShowAthleteAffiliation:  card.ShowAthleteAffiliation,
	}
	return result, nil
}

func (s *Sqlite) SetImageUrl(id uint, url string) error {
	return s.db.Model(&Card{}).Where("id = ?", id).Update("image_url", url).Error
}

func (s *Sqlite) Update(id uint, toUpdate *entities.UpdateCard) error {
	var card Card
	if err := s.db.Where("id = ?", id).First(&card).Error; err != nil {
		return err
	}

	if toUpdate.Date != nil {
		card.Date = *toUpdate.Date
	}

	if toUpdate.Name != nil {
		card.Name = *toUpdate.Name
	}

	if toUpdate.Status != nil {
		card.Status = *toUpdate.Status
	}

	if toUpdate.NumberOfJudges != nil {
		card.NumberOfJudges = *toUpdate.NumberOfJudges
	}

	if toUpdate.ShowCardImage != nil {
		card.ShowCardImage = *toUpdate.ShowCardImage
	}

	if toUpdate.ShowAthleteImages != nil {
		card.ShowAthleteImages = *toUpdate.ShowAthleteImages
	}

	if toUpdate.ShowClubImages != nil {
		card.ShowClubImages = *toUpdate.ShowClubImages
	}

	if toUpdate.ShowOfficialAffiliation != nil {
		card.ShowOfficialAffiliation = *toUpdate.ShowOfficialAffiliation
	}
	if toUpdate.ShowAthleteAffiliation != nil {
		card.ShowAthleteAffiliation = *toUpdate.ShowAthleteAffiliation
	}

	if err := s.db.Save(&card).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) Delete(id uint) error {
	if err := s.db.Where("id = ?", id).Delete(&Card{}).Error; err != nil {
		return err
	}
	return nil
}
