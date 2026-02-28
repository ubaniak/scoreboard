package storage

import (
	"time"

	"gorm.io/gorm"
)

type Round struct {
	gorm.Model
	AuditLog
	Status          BoutStatus `gorm:"not null"`
	BoutID          uint       `gorm:"not null"`
	Bout            Bout       `gorm:"foreignKey:BoutID"`
	RoundNumber     int        `gorm:"not null"`
	StartTime       time.Time  `gorm:"not null"`
	EndTime         time.Time  `gorm:"not null"`
	Scores          []Score    `gorm:"foreignKey:RoundID"`
	RedEightCounts  int        `gorm:"not null"`
	BlueEightCounts int        `gorm:"not null"`
	RedWarnings     int        `gorm:"not null"`
	BlueWarnings    int        `gorm:"not null"`
	Cautions        []Cautions `gorm:"foreignKey:RoundID"`
}

func (r *Round) AddRedEightCount() {
	r.RedEightCounts++
}

func (r *Round) AddBlueEightCount() {
	r.BlueEightCounts++
}

func (r *Round) AddRedWarning() {
	r.RedWarnings++
}

func (r *Round) AddBlueWarning() {
	r.BlueWarnings++
}

func (r *Round) CalculateScores() (redScore int, blueScore int) {
	redTotal := 0
	blueTotal := 0

	// Sum up all judge scores
	for _, score := range r.Scores {
		redTotal += score.RedCornerScore
		blueTotal += score.BlueCornerScore
	}

	// Deduct warnings
	redScore = redTotal - r.RedWarnings
	blueScore = blueTotal - r.BlueWarnings

	return redScore, blueScore
}

func (r *Round) GetRedCautions() []Cautions {
	var redCautions []Cautions
	for _, caution := range r.Cautions {
		if caution.Corner == RedCornerType {
			redCautions = append(redCautions, caution)
		}
	}
	return redCautions
}

func (r *Round) GetBlueCautions() []Cautions {
	var blueCautions []Cautions
	for _, caution := range r.Cautions {
		if caution.Corner == BlueCornerType {
			blueCautions = append(blueCautions, caution)
		}
	}
	return blueCautions
}

func (r *Round) AddRedCaution(db *gorm.DB, cautionTypeID uint) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create the caution instance
		caution := Cautions{
			RoundID:       r.ID,
			CautionTypeID: cautionTypeID,
			Corner:        RedCornerType,
			Timestamp:     time.Now(),
		}
		if err := tx.Create(&caution).Error; err != nil {
			return err
		}

		// Increment global count on CautionType
		return tx.Model(&CautionType{}).Where("id = ?", cautionTypeID).
			UpdateColumn("global_count", gorm.Expr("global_count + ?", 1)).Error
	})
}

func (r *Round) AddBlueCaution(db *gorm.DB, cautionTypeID uint) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create the caution instance
		caution := Cautions{
			RoundID:       r.ID,
			CautionTypeID: cautionTypeID,
			Corner:        BlueCornerType,
			Timestamp:     time.Now(),
		}
		if err := tx.Create(&caution).Error; err != nil {
			return err
		}

		// Increment global count on CautionType
		return tx.Model(&CautionType{}).Where("id = ?", cautionTypeID).
			UpdateColumn("global_count", gorm.Expr("global_count + ?", 1)).Error
	})
}

type Corner string

const (
	RedCornerType  Corner = "red"
	BlueCornerType Corner = "blue"
)

type StoppageReason string

const (
	StoppageRSC  StoppageReason = "RSC"   // Referee Stopped Contest
	StoppageRSCI StoppageReason = "RSC-I" // Referee Stopped Contest - Injury
	StoppageTKO  StoppageReason = "TKO"   // Technical Knockout
	StoppageABD  StoppageReason = "ABD"   // Abandoned
	StoppageDQ   StoppageReason = "DQ"    // Disqualification
	StoppageNC   StoppageReason = "NC"    // No Contest
	StoppageMD   StoppageReason = "MD"    // Medical Disqualification
)

type Stoppage struct {
	gorm.Model
	AuditLog
	BoutID      uint           `gorm:"not null;uniqueIndex"` // Only one stoppage per bout
	Bout        Bout           `gorm:"foreignKey:BoutID"`
	RoundNumber int            `gorm:"not null"`
	Corner      Corner         `gorm:"not null"`
	Reason      StoppageReason `gorm:"not null;size:10"`
	Timestamp   time.Time      `gorm:"not null"`
}

type CautionType struct {
	gorm.Model
	AuditLog
	Name        string     `gorm:"not null;unique"`
	GlobalCount int        `gorm:"not null;default:0"`
	Cautions    []Cautions `gorm:"foreignKey:CautionTypeID"`
}

type Cautions struct {
	gorm.Model
	AuditLog
	RoundID       uint        `gorm:"not null"`
	Round         Round       `gorm:"foreignKey:RoundID"`
	CautionTypeID uint        `gorm:"not null"`
	CautionType   CautionType `gorm:"foreignKey:CautionTypeID"`
	Corner        Corner      `gorm:"not null"`
	Timestamp     time.Time   `gorm:"not null"`
}
