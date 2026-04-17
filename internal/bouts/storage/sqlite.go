package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
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
		Decision:           bout.Decision,
		NumberOfJudges:     bout.NumberOfJudges,
		Referee:            bout.Referee,
		BoutType:           string(bout.BoutType),
		RedAthleteID:       bout.RedAthleteID,
		BlueAthleteID:      bout.BlueAthleteID,
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
		Decision:           bout.Decision,
		Winner:             bout.Winner,
		NumberOfJudges:     bout.NumberOfJudges,
		Referee:            bout.Referee,
		BoutType:           entities.BoutType(bout.BoutType),
		RedAthleteID:       bout.RedAthleteID,
		BlueAthleteID:      bout.BlueAthleteID,
	}
}

func (s *Sqlite) Save(cardId uint, bout *entities.Bout) (uint, error) {
	b := s.ToGormModel(cardId, bout)
	if err := s.db.Save(b).Error; err != nil {
		return 0, err
	}
	return b.ID, nil
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

func (s *Sqlite) Current(cardId uint) (*entities.Bout, error) {
	var bout Bout
	excluded := []string{
		string(entities.BoutStatusCancelled),
		string(entities.BoutStatusNotStarted),
		string(entities.BoutStatusCompleted),
	}
	// Priority: active (0) > recently completed with decision (1) > not_started (2).
	// Completed bouts use -id so the most recently ended one surfaces first.
	orderExpr := "CASE " +
		"WHEN status IN ('in_progress','waiting_for_scores','score_complete','waiting_for_decision','decision_made') THEN 0 " +
		"WHEN status = 'completed' AND winner != '' THEN 1 " +
		"WHEN status = 'not_started' THEN 2 " +
		"ELSE 3 END ASC, " +
		"CASE WHEN status = 'completed' THEN -id ELSE id END ASC"
	if err := s.db.Where("card_id = ? AND status NOT IN ?", cardId, excluded).Order(orderExpr).First(&bout).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
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

	if toUpdate.Decision != nil {
		bout.Decision = string(*toUpdate.Decision)
	}

	if toUpdate.Winner != nil {
		bout.Winner = string(*toUpdate.Winner)
	}

	if toUpdate.NumberOfJudges != nil {
		bout.NumberOfJudges = *toUpdate.NumberOfJudges
	}

	if toUpdate.Referee != nil {
		bout.Referee = *toUpdate.Referee
	}

	if toUpdate.BoutType != nil {
		bout.BoutType = string(*toUpdate.BoutType)
	}

	if toUpdate.RedAthleteID != nil {
		bout.RedAthleteID = *toUpdate.RedAthleteID
	}

	if toUpdate.BlueAthleteID != nil {
		bout.BlueAthleteID = *toUpdate.BlueAthleteID
	}

	if err := s.db.Save(bout).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) SetStatus(cardId, id uint, status entities.BoutStatus) error {
	var bout Bout
	if err := s.db.Where("card_id = ? AND id = ?", cardId, id).First(&bout).Error; err != nil {
		return err
	}

	bout.Status = string(status)
	if err := s.db.Save(bout).Error; err != nil {
		return err
	}
	return nil
}
