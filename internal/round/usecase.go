package round

import (
	"github.com/ubaniak/scoreboard/internal/round/entities"
)

type UseCase interface {
	CreateRounds(boutID uint) error
	List(boutId uint) ([]*entities.Round, error)
	UpdateStatus(boutId uint, roundNumber int, status entities.RoundStatus) error
	AddFoul(roundFoul *entities.RoundFoul) error
	ListFouls() ([]string, error)
	Get(boutId uint, roundNumber int) (*entities.RoundDetails, error)
	EightCount(boutId uint, roundNumber int, corner string, direction string) error
	Start(boutId uint, roundNumber int) error
	End(boutId uint, roundNumber int) error
	Score(boutId uint, roundNumber int) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
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
				result.Blue.Warnings = append(result.Red.Warnings, foul.Foul)
			} else {
				result.Blue.Cautions = append(result.Red.Cautions, foul.Foul)
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

func (u *useCase) EightCount(boutId uint, roundNumber int, corner string, direction string) error {
	round, err := u.storage.Get(boutId, roundNumber)
	if err != nil {
		return err
	}
	value := 1
	if direction == "down" {
		value = -1
	}

	if corner == string(entities.Red) {
		round.RedEightCounts = round.RedEightCounts + value
	}
	if corner == string(entities.Blue) {
		round.BlueEightCounts = round.BlueEightCounts + value
	}

	return u.storage.Update(boutId, roundNumber, entities.ToUpdate{
		RedEightCounts:  &round.RedEightCounts,
		BlueEightCounts: &round.BlueEightCounts,
	})

}

func (u *useCase) Start(boutId uint, roundNumber int) error {
	return u.UpdateStatus(boutId, roundNumber, entities.RoundStatusInProgress)
}

func (u *useCase) End(boutId uint, roundNumber int) error {
	complete := entities.RoundStatusComplete
	if roundNumber < 3 {
		err := u.UpdateStatus(boutId, roundNumber+1, entities.RoundStatusReady)
		if err != nil {
			return err
		}
	}

	return u.storage.Update(boutId, roundNumber, entities.ToUpdate{
		Status: &complete,
	})
}

func (u *useCase) Score(boutId uint, roundNumber int) error {
	return u.UpdateStatus(boutId, roundNumber, entities.RoundStatusWaitingForResults)
}
