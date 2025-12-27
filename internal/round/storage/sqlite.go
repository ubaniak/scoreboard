package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/round/entities"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Round{}, &Foul{}, &RoundFoul{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Create(e *entities.Round) error {
	m := EntityToModel(e)
	if err := s.db.Save(m).Error; err != nil {
		return err
	}
	return nil
}

func (s *Sqlite) Get(boutId uint, roundNumber int) (*entities.Round, error) {
	var round Round
	if err := s.db.Where("bout_id = ? and round_number = ?", boutId, roundNumber).First(&round).Error; err != nil {
		return nil, err
	}

	result := &entities.Round{
		BoutID:          boutId,
		RoundNumber:     roundNumber,
		RedEightCounts:  round.RedEightCounts,
		BlueEightCounts: round.BlueEightCounts,
		Status:          entities.RoundStatus(round.Status),
	}

	return result, nil
}

func (s *Sqlite) List(boutId uint) ([]*entities.Round, error) {
	var rounds []Round
	var response []*entities.Round
	if err := s.db.Where("bout_id = ?", boutId).Order("round_number").Find(&rounds).Error; err != nil {
		return nil, err
	}

	for _, m := range rounds {
		response = append(response, ModelToEntity(&m))
	}

	return response, nil
}

func (s *Sqlite) Update(boutId uint, roundNumber int, toUpdate entities.ToUpdate) error {
	var round Round
	if err := s.db.Where("bout_id = ? AND round_number = ?", boutId, roundNumber).First(&round).Error; err != nil {
		return err
	}

	if toUpdate.RedEightCounts != nil {
		round.RedEightCounts = *toUpdate.RedEightCounts
	}

	if toUpdate.BlueEightCounts != nil {
		round.BlueEightCounts = *toUpdate.BlueEightCounts
	}

	if toUpdate.Status != nil {
		round.Status = string(*toUpdate.Status)
	}

	if err := s.db.Save(round).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) GetFouls(boutId uint, roundNumber int) ([]*entities.RoundFoul, error) {

	var rf []RoundFoul
	if err := s.db.Where("bout_id = ? AND round_number = ?", boutId, roundNumber).Find(&rf).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []*entities.RoundFoul{}, nil
		}
		return nil, err
	}

	result := make([]*entities.RoundFoul, len(rf))
	for i, r := range rf {
		result[i] = &entities.RoundFoul{
			BoutID:      boutId,
			RoundNumber: roundNumber,
			Corner:      entities.Corner(r.Corner),
			Type:        entities.FoulType(r.Type),
			Foul:        r.Foul,
		}
	}

	return result, nil
}

func (s *Sqlite) AddFoul(foul *entities.RoundFoul) error {

	rf := &RoundFoul{
		Model:       gorm.Model{},
		BoutId:      foul.BoutID,
		Corner:      string(foul.Corner),
		Type:        string(foul.Type),
		RoundNumber: foul.RoundNumber,
		Foul:        foul.Foul,
	}

	err := s.db.Save(rf).Error
	if err != nil {
		return err
	}

	return s.countFoul(rf.Foul)
}

func (s *Sqlite) countFoul(foul string) error {
	var f Foul
	err := s.db.Where("foul = ?", foul).First(&f).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			f = Foul{
				Foul:  foul,
				Count: 0,
			}
		} else {
			return err
		}
	}

	f.Count += 1

	if err := s.db.Save(&f).Error; err != nil {
		return err
	}

	return nil
}

func (s *Sqlite) ListFouls() ([]string, error) {
	var fouls []Foul

	if err := s.db.Order("count").Find(&fouls).Error; err != nil {
		return nil, err
	}

	if len(fouls) == 0 {
		fouls = s.commonFouls()
	}

	result := make([]string, len(fouls))
	for i, f := range fouls {
		result[i] = f.Foul
	}

	return result, nil
}

func (s *Sqlite) commonFouls() []Foul {
	fouls := []string{
		"low blow",
		"slapping",
		"headbutts",
		"holding and hitting",
		"head up",
	}

	result := make([]Foul, len(fouls))
	for i, f := range fouls {
		foul := &Foul{
			Foul:  f,
			Count: 0,
		}
		s.db.Save(foul)
		result[i] = *foul
	}

	return result
}
