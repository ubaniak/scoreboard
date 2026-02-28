package scores

import (
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/scores/entities"
)

type UseCase interface {
	Create(cardId, boutId uint, numberOfJudges int) error
	RequestScores(cardId, boutId uint, roundNumber int) error
	Score(cardId, boutId uint, roundNumber int, JudgeRole string, red, blue int) error
	Complete(cardId, boutId uint, roundNumber int, JudgeRole string) error
	List(cardId, boutId uint) ([]*entities.Score, error)
}

type usecase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &usecase{storage: storage}
}

func (u *usecase) Create(cardId, boutId uint, numberOfJudges int) error {
	for judge := 0; judge < numberOfJudges; judge++ {
		for round := 1; round <= 3; round++ {
			score := &entities.Score{
				CardId:      cardId,
				BoutNumber:  int(boutId),
				RoundNumber: round,
				JudgeRole:   rbac.JudgeList[judge],
				Status:      entities.ScoreStatusNotStarted,
			}

			if err := u.storage.Create(score); err != nil {
				return err
			}
		}
	}

	return nil
}

func (u *usecase) RequestScores(cardId, boutId uint, roundNumber int) error {
	scores, err := u.storage.List(cardId, boutId)
	if err != nil {
		return err
	}

	for _, s := range scores {
		if s.RoundNumber != roundNumber {
			continue
		}

		s.Status = entities.ScoreStatusRequested
		if err := u.storage.Update(s); err != nil {
			return err
		}
	}

	return nil
}

func (u *usecase) Score(cardId, boutId uint, roundNumber int, JudgeRole string, red, blue int) error {
	score, err := u.storage.Get(cardId, boutId, roundNumber, JudgeRole)
	if err != nil {
		return err
	}
	score.Red = red
	score.Blue = blue
	if err := u.storage.Update(score); err != nil {
		return err
	}

	return nil
}

func (u *usecase) Complete(cardId, boutId uint, roundNumber int, JudgeRole string) error {
	score, err := u.storage.Get(cardId, boutId, roundNumber, JudgeRole)
	if err != nil {
		return err
	}
	score.Status = entities.ScoreStatusComplete
	if err := u.storage.Update(score); err != nil {
		return err
	}
	return nil
}

func (u *usecase) List(cardId, boutId uint) ([]*entities.Score, error) {
	return u.storage.List(cardId, boutId)
}
