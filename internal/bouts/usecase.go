package bouts

import (
	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/comment"
	"github.com/ubaniak/scoreboard/internal/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
	"github.com/ubaniak/scoreboard/internal/scores"
)

type UseCase interface {
	Create(cardId uint, bout *entities.Bout) error
	Update(cardId, id uint, bout *entities.UpdateBout) error
	List(cardId uint) ([]*entities.Bout, error)
	Get(cardId, boutId uint) (*entities.Bout, []*roundEntities.RoundDetails, error)
	Delete(cardId, id uint) error
	End(cardId, boutid uint, winner, decision, comment string) error
	UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error

	Current(cardId uint) (*entities.Bout, error)
	CurrentRound(boutId uint) (*roundEntities.Round, error)
	// round funcs
	ListRounds(boutId uint) ([]*roundEntities.Round, error)
	GetRound(cardId, boutId uint, roundNumber int) (*roundEntities.RoundDetails, error)
	AddFoul(rf *roundEntities.RoundFoul) error
	RemoveFoul(rf *roundEntities.RoundFoul) error
	EightCount(boutId uint, roundNumber int, corner string, direction string) error
	Fouls() ([]string, error)
	NextRoundState(boutId uint) (int, error)

	Score(cardId, boutId uint, roundNumber int, judgeNumber string, red, blue int) error
	CompleteScore(cardId, boutId uint, roundNumber int, JudgeNumber string) error
}

type useCase struct {
	storage      Storage
	roundUseCase round.UseCase
	comments     comment.UseCase
	score        scores.UseCase
}

func NewUseCase(storage Storage, roundUseCase round.UseCase, comments comment.UseCase, score scores.UseCase) UseCase {
	return &useCase{storage: storage, roundUseCase: roundUseCase, comments: comments, score: score}
}

func (uc *useCase) Create(cardId uint, bout *entities.Bout) error {
	bout.NumberOfJudges = 5
	boutId, err := uc.storage.Save(cardId, bout)
	if err != nil {
		return err
	}
	err = uc.roundUseCase.CreateRounds(boutId)
	if err != nil {
		return err
	}
	err = uc.score.Create(cardId, boutId, 5)
	if err != nil {
		return err
	}

	return nil
}

func (uc *useCase) Update(cardId, id uint, bout *entities.UpdateBout) error {
	return uc.storage.Update(cardId, id, bout)
}

func (uc *useCase) List(cardId uint) ([]*entities.Bout, error) {
	return uc.storage.List(cardId)
}

func (uc *useCase) Get(cardId, boutId uint) (*entities.Bout, []*roundEntities.RoundDetails, error) {
	bout, err := uc.storage.Get(cardId, boutId)
	if err != nil {
		return nil, nil, err
	}
	rounds := make([]*roundEntities.RoundDetails, 3)
	for i, roundNumber := range []int{1, 2, 3} {
		rounds[i], err = uc.roundUseCase.Get(boutId, roundNumber)
		if err != nil {
			return nil, nil, err
		}
	}
	return bout, rounds, nil
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
}

func (uc *useCase) End(cardId, boutId uint, winner, decision, comment string) error {
	err := uc.Update(cardId, boutId, &entities.UpdateBout{Decision: &decision, Winner: &winner})
	if err != nil {
		return err
	}
	err = uc.UpdateStatus(cardId, boutId, entities.BoutStatusCompleted)
	if err != nil {
		return err
	}
	if comment != "" {
		return uc.comments.Add("bout", boutId, comment)
	}
	return nil
}
func (uc *useCase) UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error {
	err := uc.storage.SetStatus(cardId, boutId, status)
	if err != nil {
		return err
	}
	if status == entities.BoutStatusInProgress {
		uc.roundUseCase.UpdateStatus(boutId, 1, roundEntities.RoundStatusReady)
	}

	return nil
}

func (uc *useCase) ListRounds(boutId uint) ([]*roundEntities.Round, error) {
	return uc.roundUseCase.List(boutId)
}

func (uc *useCase) Fouls() ([]string, error) {
	return uc.roundUseCase.ListFouls()
}

func (uc *useCase) GetRound(cardId, boutId uint, roundNumber int) (*roundEntities.RoundDetails, error) {
	return uc.roundUseCase.Get(boutId, roundNumber)
}

func (uc *useCase) AddFoul(rf *roundEntities.RoundFoul) error {
	return uc.roundUseCase.AddFoul(rf)
}

func (uc *useCase) RemoveFoul(rf *roundEntities.RoundFoul) error {
	return uc.roundUseCase.RemoveFoul(rf)
}

func (uc *useCase) EightCount(boutId uint, roundNumber int, corner string, direction string) error {
	return uc.roundUseCase.EightCount(boutId, roundNumber, corner, direction)
}

func (uc *useCase) NextRoundState(boutId uint) (int, error) {
	return uc.roundUseCase.Next(boutId)
}

func (uc *useCase) Current(cardId uint) (*entities.Bout, error) {
	bout, err := uc.storage.Current(cardId)
	if err != nil {
		return nil, err
	}
	return bout, nil
}

func (uc *useCase) CurrentRound(boutId uint) (*roundEntities.Round, error) {
	round, err := uc.roundUseCase.Current(boutId)
	if err != nil {
		return nil, err
	}
	return round, nil
}

func (uc *useCase) Score(cardId, boutId uint, roundNumber int, judgeNumber string, red, blue int) error {
	return uc.score.Score(cardId, boutId, roundNumber, judgeNumber, red, blue)
}

func (uc *useCase) CompleteScore(cardId, boutId uint, roundNumber int, JudgeNumber string) error {
	return uc.score.Complete(cardId, boutId, roundNumber, JudgeNumber)
}
