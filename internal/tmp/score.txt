package storage

import "gorm.io/gorm"

type Score struct {
	gorm.Model
	AuditLog
	Status          ScoreStatus `gorm:"not null"`
	RoundID         uint        `gorm:"not null"`
	Round           Round       `gorm:"foreignKey:RoundID"`
	OfficialID      uint        `gorm:"not null"`
	Official        Official    `gorm:"foreignKey:OfficialID"`
	RedCornerScore  int         `gorm:"not null"`
	BlueCornerScore int         `gorm:"not null"`
}

// StartScoring transitions the score to scoring status
func (s *Score) StartScoring() {
	s.Status = ScoreStatusScoring
}

// CompleteScoring transitions the score to complete status
func (s *Score) CompleteScoring() {
	s.Status = ScoreStatusComplete
}

// IsComplete returns true if the score is complete
func (s *Score) IsComplete() bool {
	return s.Status == ScoreStatusComplete
}

// IsScoring returns true if the score is currently being scored
func (s *Score) IsScoring() bool {
	return s.Status == ScoreStatusScoring
}

// IsReady returns true if the score is ready to be scored
func (s *Score) IsReady() bool {
	return s.Status == ScoreStatusReady
}
