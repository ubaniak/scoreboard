package storage

import (
	"github.com/ubaniak/scoreboard/internal/scores/entities"
	"gorm.io/gorm"
)

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Score{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func toStorageModel(e *entities.Score) *Score {
	if e == nil {
		return nil
	}

	return &Score{
		CardId:      e.CardId,
		BoutNumber:  e.BoutNumber,
		RoundNumber: e.RoundNumber,
		JudgeRole:   e.JudgeRole,
		JudgeName:   e.JudgeName,
		Red:         e.Red,
		Blue:        e.Blue,
		Status:      string(e.Status),
	}
}

func (s *Score) toEntity() *entities.Score {
	if s == nil {
		return nil
	}

	return &entities.Score{
		CardId:      s.CardId,
		BoutNumber:  s.BoutNumber,
		RoundNumber: s.RoundNumber,
		JudgeRole:   s.JudgeRole,
		JudgeName:   s.JudgeName,
		Red:         s.Red,
		Blue:        s.Blue,
		Status:      entities.ScoreStatus(s.Status),
	}
}

func (s *Sqlite) Create(score *entities.Score) error {
	return s.db.Create(toStorageModel(score)).Error
}

func (s *Sqlite) Update(score *entities.Score) error {
	m := toStorageModel(score)

	return s.db.
		Model(&Score{}).
		Where(
			"card_id = ? AND bout_number = ? AND round_number = ? AND judge_role = ?",
			m.CardId,
			m.BoutNumber,
			m.RoundNumber,
			m.JudgeRole,
		).
		Updates(m).
		Error
}

func (s *Sqlite) List(cardId, boutId uint) ([]*entities.Score, error) {
	var rows []Score
	if err := s.db.
		Where("card_id = ? AND bout_number = ?", cardId, boutId).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	result := make([]*entities.Score, 0, len(rows))
	for i := range rows {
		result = append(result, rows[i].toEntity())
	}

	return result, nil
}

func (s *Sqlite) DeleteByBout(cardId, boutId uint) error {
	return s.db.Where("card_id = ? AND bout_number = ?", cardId, boutId).Delete(&Score{}).Error
}

func (s *Sqlite) Get(cardId, boutId uint, roundNumber int, judgeRole string) (*entities.Score, error) {
	var row Score
	if err := s.db.
		Where(
			"card_id = ? AND bout_number = ? AND round_number = ? AND judge_role = ?",
			cardId,
			boutId,
			roundNumber,
			judgeRole,
		).
		First(&row).Error; err != nil {
		return nil, err
	}

	return row.toEntity(), nil
}
