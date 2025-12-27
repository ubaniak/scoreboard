package storage

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/round/entities"
)

type Round struct {
	gorm.Model
	BoutID          uint
	RoundNumber     int
	RedEightCounts  int
	BlueEightCounts int
	Status          string
}

type RoundFoul struct {
	gorm.Model
	BoutId      uint
	Corner      string
	Type        string
	RoundNumber int
	Foul        string
}

func EntityToModel(e *entities.Round) *Round {
	return &Round{
		Model:           gorm.Model{},
		BoutID:          e.BoutID,
		RoundNumber:     e.RoundNumber,
		RedEightCounts:  e.RedEightCounts,
		BlueEightCounts: e.BlueEightCounts,
		Status:          string(e.Status),
	}
}

func ModelToEntity(m *Round) *entities.Round {
	return &entities.Round{
		BoutID:          m.BoutID,
		RoundNumber:     m.RoundNumber,
		RedEightCounts:  m.RedEightCounts,
		BlueEightCounts: m.BlueEightCounts,
		Status:          entities.RoundStatus(m.Status),
	}
}

type Foul struct {
	gorm.Model
	Foul  string
	Count int
}
