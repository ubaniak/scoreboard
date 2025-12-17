package storage

import (
	"strings"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/round/entities"
)

type Round struct {
	gorm.Model
	BoutID          uint
	RoundNumber     int
	RedWarnings     string
	BlueWarnings    string
	RedCautions     string
	BlueCautions    string
	RedEightCounts  int
	BlueEightCounts int
	RedScore        int
	BlueScore       int
	Decision        string
	Status          string
}

func EntityToModel(e *entities.Round) *Round {
	return &Round{
		Model:           gorm.Model{},
		BoutID:          e.BoutID,
		RoundNumber:     e.RoundNumber,
		RedWarnings:     strings.Join(e.RedWarnings, ","),
		BlueWarnings:    strings.Join(e.RedWarnings, ","),
		RedCautions:     strings.Join(e.RedCautions, ","),
		BlueCautions:    strings.Join(e.BlueCautions, ","),
		RedEightCounts:  e.RedEightCounts,
		BlueEightCounts: e.BlueEightCounts,
		RedScore:        e.RedScore,
		BlueScore:       e.BlueScore,
		Decision:        e.Decision,
		Status:          string(e.Status),
	}
}

func ModelToEntity(m *Round) *entities.Round {

	return &entities.Round{
		BoutID:          m.BoutID,
		RoundNumber:     m.RoundNumber,
		RedWarnings:     strings.Split(m.RedWarnings, ","),
		BlueWarnings:    strings.Split(m.BlueWarnings, ","),
		RedCautions:     strings.Split(m.RedCautions, ","),
		BlueCautions:    strings.Split(m.BlueCautions, ","),
		RedEightCounts:  m.RedEightCounts,
		BlueEightCounts: m.BlueEightCounts,
		RedScore:        m.RedScore,
		BlueScore:       m.BlueScore,
		Decision:        m.Decision,
		Status:          entities.RoundStatus(m.Status),
	}
}
