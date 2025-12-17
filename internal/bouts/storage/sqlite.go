package storage

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/bouts/entities"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Bout{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (*Sqlite) ToGormModel(cardId uint, bout *entities.Bout) *Bout {
	return &Bout{
		CardID:             cardId,
		BoutNumber:         bout.BoutNumber,
		RedCorner:          bout.RedCorner,
		BlueCorner:         bout.BlueCorner,
		WeightClass:        bout.WeightClass,
		GloveSize:          string(bout.GloveSize),
		RoundLength:        float64(bout.RoundLength),
		AgeCategory:        string(bout.AgeCategory),
		Experience:         string(bout.Experience),
		RedCornerImageUrl:  bout.RedCornerImageUrl,
		BlueCornerImageUrl: bout.BlueCornerImageUrl,
		Status:             string(bout.Status),
		Gender:             string(bout.Gender),
	}
}

func (*Sqlite) ToEntity(bout Bout) *entities.Bout {
	return &entities.Bout{
		ID:                 bout.ID,
		CardID:             bout.CardID,
		BoutNumber:         bout.BoutNumber,
		RedCorner:          bout.RedCorner,
		BlueCorner:         bout.BlueCorner,
		WeightClass:        bout.WeightClass,
		Gender:             entities.Gender(bout.Gender),
		GloveSize:          entities.GloveSize(bout.GloveSize),
		RoundLength:        entities.RoundLength(bout.RoundLength),
		AgeCategory:        entities.AgeCategory(bout.AgeCategory),
		Experience:         entities.Experience(bout.Experience),
		RedCornerImageUrl:  bout.RedCornerImageUrl,
		BlueCornerImageUrl: bout.BlueCornerImageUrl,
		Status:             entities.BoutStatus(bout.Status),
	}
}

func (s *Sqlite) Save(cardId uint, bout *entities.Bout) error {
	b := s.ToGormModel(cardId, bout)
	if err := s.db.Save(b).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) List(cardId uint) ([]*entities.Bout, error) {

	var bouts []Bout
	var response []*entities.Bout
	if err := s.db.Where("card_id = ?", cardId).Order("bout_number").Find(&bouts).Error; err != nil {
		return []*entities.Bout{}, err
	}

	for _, b := range bouts {
		response = append(response, s.ToEntity(b))
	}
	return response, nil
}

func (s *Sqlite) Get(cardId, id uint) (*entities.Bout, error) {
	var bout Bout
	if err := s.db.Where("card_id = ? AND id = ?", cardId, id).First(&bout).Error; err != nil {
		return nil, err
	}
	e := s.ToEntity(bout)
	return e, nil
}

func (s *Sqlite) Delete(cardId, id uint) error {
	if err := s.db.Where("card_id = ? AND id = ?", cardId, id).Delete(&Bout{}).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) Update(cardId, id uint, toUpdate *entities.UpdateBout) error {
	var bout Bout
	if err := s.db.Where("card_id = ? AND id = ?", cardId, id).First(&bout).Error; err != nil {
		return err
	}

	if toUpdate.BoutNumber != nil {
		bout.BoutNumber = *toUpdate.BoutNumber
	}

	if toUpdate.RedCorner != nil {
		bout.RedCorner = *toUpdate.RedCorner
	}

	if toUpdate.BlueCorner != nil {
		bout.BlueCorner = *toUpdate.BlueCorner
	}

	if toUpdate.Gender != nil {
		bout.Gender = string(*toUpdate.Gender)
	}

	if toUpdate.WeightClass != nil {
		bout.WeightClass = *toUpdate.WeightClass
	}

	if toUpdate.GloveSize != nil {
		bout.GloveSize = string(*toUpdate.GloveSize)
	}

	if toUpdate.RoundLength != nil {
		bout.RoundLength = float64(*toUpdate.RoundLength)
	}

	if toUpdate.AgeCategory != nil {
		bout.AgeCategory = string(*toUpdate.AgeCategory)
	}

	if toUpdate.Experience != nil {
		bout.Experience = string(*toUpdate.Experience)
	}

	if err := s.db.Save(bout).Error; err != nil {
		return err
	}

	return nil
}
