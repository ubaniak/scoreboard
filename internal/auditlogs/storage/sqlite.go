package storage

import (
	"time"

	"github.com/ubaniak/scoreboard/internal/auditlogs/entities"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"autoCreateTime"`

	CardID      uint
	BoutID      *uint
	RoundNumber *int

	ActorRole string
	ActorName *string

	Action       string
	HumanSummary string
	MetadataJSON string `gorm:"type:text"`
}

type Sqlite struct {
	db *gorm.DB
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&AuditLog{}); err != nil {
		return nil, err
	}
	return &Sqlite{db: db}, nil
}

func toStorageModel(e *entities.AuditLog) *AuditLog {
	if e == nil {
		return nil
	}
	return &AuditLog{
		ID:           e.ID,
		CreatedAt:    e.CreatedAt,
		CardID:       e.CardID,
		BoutID:       e.BoutID,
		RoundNumber:  e.RoundNumber,
		ActorRole:    e.ActorRole,
		ActorName:    e.ActorName,
		Action:       e.Action,
		HumanSummary: e.HumanSummary,
		MetadataJSON: e.MetadataJSON,
	}
}

func (m *AuditLog) toEntity() *entities.AuditLog {
	if m == nil {
		return nil
	}
	return &entities.AuditLog{
		ID:           m.ID,
		CreatedAt:    m.CreatedAt,
		CardID:       m.CardID,
		BoutID:       m.BoutID,
		RoundNumber:  m.RoundNumber,
		ActorRole:    m.ActorRole,
		ActorName:    m.ActorName,
		Action:       m.Action,
		HumanSummary: m.HumanSummary,
		MetadataJSON: m.MetadataJSON,
	}
}

func (s *Sqlite) Create(e *entities.AuditLog) error {
	return s.db.Create(toStorageModel(e)).Error
}

func (s *Sqlite) ListByCard(cardId uint) ([]*entities.AuditLog, error) {
	var rows []AuditLog
	if err := s.db.
		Where("card_id = ?", cardId).
		Order("created_at asc, id asc").
		Find(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]*entities.AuditLog, 0, len(rows))
	for i := range rows {
		out = append(out, rows[i].toEntity())
	}
	return out, nil
}

