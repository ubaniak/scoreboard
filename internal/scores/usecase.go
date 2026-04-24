package scores

import (
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/scores/entities"
)

type UseCase interface {
	Create(cardId, boutId uint, numberOfJudges int) error
	Recreate(cardId, boutId uint, numberOfJudges int) error
	RequestScores(cardId, boutId uint, roundNumber int) error
	Ready(cardId, boutId uint, roundNumber int, judgeRole, judgeName string) error
	Score(cardId, boutId uint, roundNumber int, JudgeRole string, red, blue int) error
	Complete(cardId, boutId uint, roundNumber int, JudgeRole string) error
	List(cardId, boutId uint) ([]*entities.Score, error)
	SetOverallWinner(cardId, boutId uint, judgeRole, winner string) error
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

func (u *usecase) Recreate(cardId, boutId uint, numberOfJudges int) error {
	existing, err := u.storage.List(cardId, boutId)
	if err != nil {
		return err
	}

	existingRoles := make(map[string]bool)
	for _, s := range existing {
		existingRoles[s.JudgeRole] = true
	}

	for judge := 0; judge < numberOfJudges; judge++ {
		role := rbac.JudgeList[judge]
		if existingRoles[role] {
			continue
		}
		for round := 1; round <= 3; round++ {
			score := &entities.Score{
				CardId:      cardId,
				BoutNumber:  int(boutId),
				RoundNumber: round,
				JudgeRole:   role,
				Status:      entities.ScoreStatusNotStarted,
			}
			if err := u.storage.Create(score); err != nil {
				return err
			}
		}
	}

	for judge := numberOfJudges; judge < len(rbac.JudgeList); judge++ {
		role := rbac.JudgeList[judge]
		if !existingRoles[role] {
			continue
		}
		if err := u.storage.DeleteByJudgeRole(cardId, boutId, role); err != nil {
			return err
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

func (u *usecase) Ready(cardId, boutId uint, roundNumber int, judgeRole, judgeName string) error {
	score, err := u.storage.Get(cardId, boutId, roundNumber, judgeRole)
	if err != nil {
		return err
	}
	score.Status = entities.ScoreStatusReady
	score.JudgeName = judgeName
	return u.storage.Update(score)
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

func (u *usecase) SetOverallWinner(cardId, boutId uint, judgeRole, winner string) error {
	return u.storage.SetOverallWinner(cardId, boutId, judgeRole, winner)
}
