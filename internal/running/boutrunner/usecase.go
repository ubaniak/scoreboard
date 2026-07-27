package boutrunner

import (
	"fmt"

	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/running/comment"
	"github.com/ubaniak/scoreboard/internal/running/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/running/round/entities"
)

//go:generate mockgen -destination=./mocks/mock_storage.go -package=mocks github.com/ubaniak/scoreboard/internal/running/boutrunner Storage

// Storage is the narrow slice of bouts.Storage this package needs to progress a bout
// through its live rounds to a decision. It's satisfied directly by the same concrete
// storage passed to the matchmaking bouts package — the two packages share one bouts
// table via their own independently-scoped interfaces.
type Storage interface {
	Get(cardId, id uint) (*entities.Bout, error)
	Update(cardId, id uint, bout *entities.UpdateBout) error
	SetStatus(cardId, id uint, status entities.BoutStatus) error
	Current(cardId uint) (*entities.Bout, error)
}

// UseCase covers progressing a bout live: decisions, status transitions, and the
// current bout/round pointers polled by the public scoreboard. Creating, pairing, and
// editing bouts lives in matchmaking/bouts, which owns the Storage and Bout entity.
type UseCase interface {
	MakeDecision(cardId, boutId uint, winner, decision, comment string) error
	ShowDecision(cardId, boutId uint) error
	Complete(cardId, boutId uint) error
	UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error
	Current(cardId uint) (*entities.Bout, error)
	CurrentRound(boutId uint) (*roundEntities.Round, error)
	GetBoutType(cardId, boutId uint) (entities.BoutType, error)
}

type useCase struct {
	storage      Storage
	roundUseCase round.UseCase
	comments     comment.UseCase
	onBoutStart  func()
}

func NewUseCase(storage Storage, roundUseCase round.UseCase, comments comment.UseCase) UseCase {
	return &useCase{storage: storage, roundUseCase: roundUseCase, comments: comments}
}

// SetBoutStartHook registers fn to be called once when any bout first transitions to in_progress.
func SetBoutStartHook(uc UseCase, fn func()) {
	if u, ok := uc.(*useCase); ok {
		u.onBoutStart = fn
	}
}

func (uc *useCase) MakeDecision(cardId, boutId uint, winner, decision, comment string) error {
	update := &entities.UpdateBout{Decision: &decision, Winner: &winner}
	if currentRound, err := uc.roundUseCase.Current(boutId); err == nil && currentRound != nil {
		roundNumber := currentRound.RoundNumber
		update.RoundEndedOn = &roundNumber
	}
	if err := uc.storage.Update(cardId, boutId, update); err != nil {
		return err
	}
	if err := uc.storage.SetStatus(cardId, boutId, entities.BoutStatusDecisionMade); err != nil {
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

func (uc *useCase) GetBoutType(cardId, boutId uint) (entities.BoutType, error) {
	bout, err := uc.storage.Get(cardId, boutId)
	if err != nil {
		return "", err
	}
	return bout.BoutType, nil
}
