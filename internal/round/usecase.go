package round

import "github.com/ubaniak/scoreboard/internal/round/entities"

type UseCase interface {
	CreateRounds(boutID uint) error
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
