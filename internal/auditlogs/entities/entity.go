package entities

import "time"

// AuditLog is a single audit entry for a card/bout lifecycle or judge action.
type AuditLog struct {
	ID uint `gorm:"primaryKey"`

	CreatedAt time.Time `gorm:"autoCreateTime"`

	CardID uint `gorm:"index;not null"`

	// Optional context for grouping/rendering.
	BoutID      *uint `gorm:"index"`
	RoundNumber *int  `gorm:"index"`

	ActorRole string  `gorm:"index;not null"`
	ActorName *string `gorm:""`

	// Action is a stable identifier like "round.advance" or "judge.score.submit".
	Action string `gorm:"index;not null"`

	// HumanSummary is a short human-friendly description suitable for UI timelines.
	HumanSummary string `gorm:"not null"`

	// MetadataJSON is optional structured details (JSON string).
	MetadataJSON string `gorm:"type:text"`
}

