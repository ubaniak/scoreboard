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
	}
}

func (*Sqlite) ToEntity(bout Bout) *entities.Bout {
	return &entities.Bout{
		CardID:             bout.CardID,
		BoutNumber:         bout.BoutNumber,
		RedCorner:          bout.RedCorner,
		BlueCorner:         bout.BlueCorner,
		WeightClass:        bout.WeightClass,
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

func (s *Sqlite) Get(cardId uint) ([]*entities.Bout, error) {

	var bouts []Bout
	var response []*entities.Bout
	if err := s.db.Where("card_id = ?", cardId).Find(&bouts).Error; err != nil {
		return []*entities.Bout{}, err
	}

	for _, b := range bouts {
		response = append(response, s.ToEntity(b))
	}
	return response, nil
}

func (s *Sqlite) Delete(cardId, id uint) error {
	if err := s.db.Where("card_id = ? AND id = ?", cardId, id).Delete(&Bout{}).Error; err != nil {
		return err
	}

	return nil
}
