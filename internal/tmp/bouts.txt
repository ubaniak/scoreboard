package storage

import (
	"time"

	"gorm.io/gorm"
)

type BoutStatus string

const (
	BoutStatusNotStarted       BoutStatus = "not_started"
	BoutStatusReady            BoutStatus = "ready"
	BoutStatusInProgress       BoutStatus = "in_progress"
	BoutStatusWaitingForResult BoutStatus = "waiting_for_result"
	BoutStatusCompleted        BoutStatus = "completed"
	BoutStatusCancelled        BoutStatus = "cancelled"
)

type ScoreStatus string

const (
	ScoreStatusReady    ScoreStatus = "ready"
	ScoreStatusScoring  ScoreStatus = "scoring"
	ScoreStatusComplete ScoreStatus = "complete"
)

type Experience string

const (
	Novice Experience = "novice"
	Open   Experience = "open"
)

type AgeCategory string

const (
	JuniorA AgeCategory = "juniorA"
	JuniorB AgeCategory = "juniorB"
	JuniorC AgeCategory = "juniorC"
	Youth   AgeCategory = "youth"
	Elite   AgeCategory = "elite"
	Masters AgeCategory = "masters"
)

type GloveSize string

const (
	TenOz     GloveSize = "10oz"
	TwelveOz  GloveSize = "12oz"
	SixteenOz GloveSize = "16oz"
)

type RoundLength float64

const (
	ThreeMinutes  RoundLength = 3.0
	TwoMinutes    RoundLength = 2.0
	OneMinute     RoundLength = 1.0
	OneHalfMinute RoundLength = 1.5
)

type Bout struct {
	gorm.Model
	AuditLog
	CardID             uint        `gorm:"not null"`
	Card               Card        `gorm:"foreignKey:CardID"`
	BoutNumber         int         `gorm:"not null"`
	RedCorner          string      `gorm:"not null"`
	BlueCorner         string      `gorm:"not null"`
	WeightClass        string      `gorm:"not null"`
	GloveSize          GloveSize   `gorm:"not null"`
	RoundLength        RoundLength `gorm:"not null"`
	AgeCategory        AgeCategory `gorm:"not null"`
	Experience         Experience  `gorm:"not null"`
	RedCornerImageUrl  string
	BlueCornerImageUrl string
	Rounds             []Round    `gorm:"foreignKey:BoutID"`
	Stoppage           *Stoppage  `gorm:"foreignKey:BoutID"` // Only one stoppage allowed per bout
	Status             BoutStatus `gorm:"not null"`
	Decision           string     `gorm:"not null"`
}

// AddStoppage records or updates the stoppage for this bout (only one allowed)
// When a stoppage is added, the bout is automatically marked as completed
func (b *Bout) AddStoppage(db *gorm.DB, roundNumber int, corner Corner, reason StoppageReason, userID string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Check if stoppage already exists for this bout
		var existing Stoppage
		err := tx.Where("bout_id = ?", b.ID).First(&existing).Error

		if err == nil {
			// Stoppage exists, update it
			existing.RoundNumber = roundNumber
			existing.Corner = corner
			existing.Reason = reason
			existing.Timestamp = time.Now()
			if err := tx.Save(&existing).Error; err != nil {
				return err
			}
		} else {
			// No existing stoppage, create new one
			stoppage := Stoppage{
				BoutID:      b.ID,
				RoundNumber: roundNumber,
				Corner:      corner,
				Reason:      reason,
				Timestamp:   time.Now(),
			}
			if err := tx.Create(&stoppage).Error; err != nil {
				return err
			}
		}

		// Mark the bout as completed since a stoppage occurred
		b.Status = BoutStatusCompleted
		if err := tx.Save(b).Error; err != nil {
			return err
		}

		return nil
	})
}

// GetStoppage returns the stoppage for this bout if one exists
func (b *Bout) GetStoppage(db *gorm.DB) (*Stoppage, error) {
	var stoppage Stoppage
	err := db.Where("bout_id = ?", b.ID).First(&stoppage).Error
	if err != nil {
		return nil, err
	}
	return &stoppage, nil
}

// HasStoppage returns true if this bout has a stoppage recorded
func (b *Bout) HasStoppage() bool {
	return b.Stoppage != nil
}

// RemoveStoppage deletes the stoppage for this bout
func (b *Bout) RemoveStoppage(db *gorm.DB) error {
	return db.Where("bout_id = ?", b.ID).Delete(&Stoppage{}).Error
}

type BoutResult struct {
	RedTotalScore  int
	BlueTotalScore int
	Winner         Corner
	IsDraw         bool
	RoundScores    []RoundScore
}

type RoundScore struct {
	RoundNumber int
	RedScore    int
	BlueScore   int
}

// CalculateOverallWinner sums scores across all rounds and determines the winner
func (b *Bout) CalculateOverallWinner() BoutResult {
	redTotal := 0
	blueTotal := 0
	roundScores := make([]RoundScore, 0, len(b.Rounds))

	// Sum up scores from all rounds
	for _, round := range b.Rounds {
		redScore, blueScore := round.CalculateScores()
		redTotal += redScore
		blueTotal += blueScore

		roundScores = append(roundScores, RoundScore{
			RoundNumber: round.RoundNumber,
			RedScore:    redScore,
			BlueScore:   blueScore,
		})
	}

	result := BoutResult{
		RedTotalScore:  redTotal,
		BlueTotalScore: blueTotal,
		RoundScores:    roundScores,
	}

	// Determine winner
	if redTotal > blueTotal {
		result.Winner = RedCornerType
	} else if blueTotal > redTotal {
		result.Winner = BlueCornerType
	} else {
		result.IsDraw = true
	}

	return result
}

// GetNextReadyBoutAnyCard returns the next bout in Ready state across all cards
func GetNextReadyBoutAnyCard(db *gorm.DB) (*Bout, error) {
	var bout Bout
	err := db.Where("status = ?", BoutStatusReady).
		Order("card_id asc, bout_number asc").
		First(&bout).Error

	if err != nil {
		return nil, err
	}

	return &bout, nil
}
