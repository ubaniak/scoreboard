package bouts

import (
	"fmt"

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
	Get(cardId, boutId uint) (*entities.Bout, []*roundEntities.RoundDetails, []string, error)
	Delete(cardId, id uint) error
	MakeDecision(cardId, boutId uint, winner, decision, comment string) error
	Complete(cardId, boutId uint) error
	ShowDecision(cardId, boutId uint) error
	UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error

	Current(cardId uint) (*entities.Bout, error)
	CurrentRound(boutId uint) (*roundEntities.Round, error)
}

type useCase struct {
	storage      Storage
	roundUseCase round.UseCase
	comments     comment.UseCase
	score        scores.UseCase
	onBoutStart  func()
}

func NewUseCase(storage Storage, roundUseCase round.UseCase, comments comment.UseCase, score scores.UseCase) UseCase {
	return &useCase{storage: storage, roundUseCase: roundUseCase, comments: comments, score: score}
}

// SetBoutStartHook registers fn to be called once when any bout first transitions to in_progress.
func SetBoutStartHook(uc UseCase, fn func()) {
	if u, ok := uc.(*useCase); ok {
		u.onBoutStart = fn
	}
}

func (uc *useCase) Create(cardId uint, bout *entities.Bout) error {
	if bout.BoutType == "" {
		bout.BoutType = entities.BoutTypeScored
	}

	if bout.BoutType == entities.BoutTypeSparring || bout.BoutType == entities.BoutTypeDevelopmental {
		bout.NumberOfJudges = 0
	} else if bout.NumberOfJudges == 0 {
		bout.NumberOfJudges = 5
	}

	boutId, err := uc.storage.Save(cardId, bout)
	if err != nil {
		return err
	}
	err = uc.roundUseCase.CreateRounds(boutId)
	if err != nil {
		return err
	}
	if bout.NumberOfJudges > 0 {
		if err = uc.score.Create(cardId, boutId, bout.NumberOfJudges); err != nil {
			return err
		}
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
	var oldJudgeCount int
	if bout.NumberOfJudges != nil {
		current, err := uc.storage.Get(cardId, id)
		if err != nil {
			return err
		}
		oldJudgeCount = current.NumberOfJudges
	}

	if err := uc.storage.Update(cardId, id, bout); err != nil {
		return err
	}

	if bout.NumberOfJudges != nil && *bout.NumberOfJudges != oldJudgeCount {
		if err := uc.score.Recreate(cardId, id, *bout.NumberOfJudges); err != nil {
			return err
		}
	}
	return nil
}

func (uc *useCase) List(cardId uint) ([]*entities.Bout, error) {
	return uc.storage.List(cardId)
}

func (uc *useCase) Get(cardId, boutId uint) (*entities.Bout, []*roundEntities.RoundDetails, []string, error) {
	bout, err := uc.storage.Get(cardId, boutId)
	if err != nil {
		return nil, nil, nil, err
	}
	rounds := make([]*roundEntities.RoundDetails, 3)
	for i, roundNumber := range []int{1, 2, 3} {
		rounds[i], err = uc.roundUseCase.Get(boutId, roundNumber)
		if err != nil {
			return nil, nil, nil, err
		}
	}
	commentEntities, err := uc.comments.Get("bout", boutId)
	if err != nil {
		return nil, nil, nil, err
	}
	comments := make([]string, len(commentEntities))
	for i, c := range commentEntities {
		comments[i] = c.Comment
	}
	return bout, rounds, comments, nil
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
}

func (uc *useCase) MakeDecision(cardId, boutId uint, winner, decision, comment string) error {
	update := &entities.UpdateBout{Decision: &decision, Winner: &winner}
	if currentRound, err := uc.roundUseCase.Current(boutId); err == nil && currentRound != nil {
		roundNumber := currentRound.RoundNumber
		update.RoundEndedOn = &roundNumber
	}
	err := uc.Update(cardId, boutId, update)
	if err != nil {
		return err
	}
	err = uc.storage.SetStatus(cardId, boutId, entities.BoutStatusDecisionMade)
	if err != nil {
		return err
	}
	if comment != "" {
		return uc.comments.Add("bout", boutId, comment)
	}
	return nil
}

func (uc *useCase) ShowDecision(cardId, boutId uint) error {
	return uc.storage.SetStatus(cardId, boutId, entities.BoutStatusShowDecision)
}

func (uc *useCase) Complete(cardId, boutId uint) error {
	return uc.storage.SetStatus(cardId, boutId, entities.BoutStatusCompleted)
}

func (uc *useCase) UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error {
	var prevStatus entities.BoutStatus
	if status == entities.BoutStatusInProgress {
		bout, err := uc.storage.Get(cardId, boutId)
		if err != nil {
			return err
		}
		prevStatus = bout.Status
		// Only validate preconditions on the initial start
		if prevStatus == entities.BoutStatusNotStarted {
			switch bout.BoutType {
			case entities.BoutTypeDevelopmental:
				if bout.Referee == "" {
					return fmt.Errorf("a referee is required to start a developmental bout")
				}
			case entities.BoutTypeScored:
				if bout.Referee == "" {
					return fmt.Errorf("a referee is required to start a scored bout")
				}
			}
		}
	}

	if err := uc.storage.SetStatus(cardId, boutId, status); err != nil {
		return err
	}
	// On initial start only, advance round 1 to in_progress and trigger backup.
	if status == entities.BoutStatusInProgress && prevStatus == entities.BoutStatusNotStarted {
		_ = uc.roundUseCase.UpdateStatus(boutId, 1, roundEntities.RoundStatusReady)
		if uc.onBoutStart != nil {
			go uc.onBoutStart()
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
