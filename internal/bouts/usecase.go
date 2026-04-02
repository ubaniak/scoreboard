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
	CreateBulk(cardId uint, bouts []*entities.Bout) error
	Update(cardId, id uint, bout *entities.UpdateBout) error
	List(cardId uint) ([]*entities.Bout, error)
	Get(cardId, boutId uint) (*entities.Bout, []*roundEntities.RoundDetails, error)
	Delete(cardId, id uint) error
	End(cardId, boutid uint, winner, decision, comment string) error
	UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error

	Current(cardId uint) (*entities.Bout, error)
	CurrentRound(boutId uint) (*roundEntities.Round, error)
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

func (uc *useCase) CreateBulk(cardId uint, bouts []*entities.Bout) error {
	for _, bout := range bouts {
		if err := uc.Create(cardId, bout); err != nil {
			return err
		}
	}
	return nil
}

func (uc *useCase) Update(cardId, id uint, bout *entities.UpdateBout) error {
	if err := uc.storage.Update(cardId, id, bout); err != nil {
		return err
	}
	if bout.NumberOfJudges != nil {
		if err := uc.score.Recreate(cardId, id, *bout.NumberOfJudges); err != nil {
			return err
		}
	}
	return nil
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
		if err = uc.roundUseCase.UpdateStatus(boutId, 1, roundEntities.RoundStatusReady); err != nil {
			return err
		}
	}

	return nil
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

