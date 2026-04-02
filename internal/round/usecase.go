package round

import (
	"errors"
	"fmt"

	"github.com/ubaniak/scoreboard/internal/round/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
	"gorm.io/gorm"
)

type UseCase interface {
	Next(boutId uint) (int, error)
	CreateRounds(boutID uint) error
	List(boutId uint) ([]*entities.Round, error)
	UpdateStatus(boutId uint, roundNumber int, status entities.RoundStatus) error
	AddFoul(roundFoul *entities.RoundFoul) error
	RemoveFoul(roundFoul *entities.RoundFoul) error
	ListFouls() ([]string, error)
	Get(boutId uint, roundNumber int) (*entities.RoundDetails, error)
	Current(boutId uint) (*entities.Round, error)
	EightCount(boutId uint, roundNumber int, corner string, direction string) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (u *useCase) Next(boutId uint) (int, error) {
	roundNumbers := []int{1, 2, 3}
	rounds := make([]*entities.RoundDetails, 3)
	for i, roundNumber := range roundNumbers {
		round, err := u.Get(boutId, roundNumber)
		if err != nil {
			return -1, err
		}
		rounds[i] = round
	}
	currentRound := nextState(rounds)

	for _, round := range rounds {
		if err := u.UpdateStatus(boutId, round.RoundNumber, round.Status); err != nil {
			return -1, err
		}
	}

	return currentRound + 1, nil
}

func (u *useCase) CreateRounds(boutID uint) error {
	roundNumbers := []int{1, 2, 3}
	for _, roundNumber := range roundNumbers {
		round := &entities.Round{
			BoutID:      boutID,
			RoundNumber: roundNumber,
			Status:      entities.RoundStatusNotStarted,
		}
		err := u.storage.Create(round)
		if err != nil {
			return err
		}
	}
	return nil
}

func (u *useCase) List(boutId uint) ([]*entities.Round, error) {
	return u.storage.List(boutId)
}

func (u *useCase) UpdateStatus(boutId uint, roundNumber int, status entities.RoundStatus) error {
	return u.storage.Update(boutId, roundNumber, entities.ToUpdate{
		Status: &status,
	})
}

func (u *useCase) Get(boutId uint, roundNumber int) (*entities.RoundDetails, error) {
	result := &entities.RoundDetails{
		BoutID:      boutId,
		RoundNumber: roundNumber,
	}
	round, err := u.storage.Get(boutId, roundNumber)
	if err != nil {
		return nil, err
	}

	result.Status = round.Status
	result.Red = entities.CornerDetails{
		Warnings:    []string{},
		Cautions:    []string{},
		EightCounts: round.RedEightCounts,
	}
	result.Blue = entities.CornerDetails{
		Warnings:    []string{},
		Cautions:    []string{},
		EightCounts: round.BlueEightCounts,
	}

	fouls, err := u.storage.GetFouls(boutId, roundNumber)
	if err != nil {
		return nil, err
	}

	for _, foul := range fouls {
		if foul.Corner == entities.Red {
			if foul.Type == entities.FoulTypeWarning {
				result.Red.Warnings = append(result.Red.Warnings, foul.Foul)
			} else {
				result.Red.Cautions = append(result.Red.Cautions, foul.Foul)
			}
		}
		if foul.Corner == entities.Blue {
			if foul.Type == entities.FoulTypeWarning {
				result.Blue.Warnings = append(result.Blue.Warnings, foul.Foul)
			} else {
				result.Blue.Cautions = append(result.Blue.Cautions, foul.Foul)
			}
		}
	}

	return result, nil
}

func (u *useCase) ListFouls() ([]string, error) {
	return u.storage.ListFouls()
}

func (u *useCase) AddFoul(rf *entities.RoundFoul) error {
	return u.storage.AddFoul(rf)
}

func (u *useCase) RemoveFoul(rf *entities.RoundFoul) error {
	return u.storage.RemoveFoul(rf)
}

func (u *useCase) EightCount(boutId uint, roundNumber int, corner string, direction string) error {
	if corner != string(entities.Red) && corner != string(entities.Blue) {
		return fmt.Errorf("invalid corner %q", corner)
	}

	round, err := u.storage.Get(boutId, roundNumber)
	if err != nil {
		return err
	}

	value := 1
	if direction == "down" {
		value = -1
	}

	if corner == string(entities.Red) {
		round.RedEightCounts = max(0, round.RedEightCounts+value)
	}
	if corner == string(entities.Blue) {
		round.BlueEightCounts = max(0, round.BlueEightCounts+value)
	}

	return u.storage.Update(boutId, roundNumber, entities.ToUpdate{
		RedEightCounts:  &round.RedEightCounts,
		BlueEightCounts: &round.BlueEightCounts,
	})
}
func (u *useCase) Current(boutId uint) (*entities.Round, error) {
	round, err := u.storage.Current(boutId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}
	return round, nil
}
