package bouts

import (
	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/running/comment"
	"github.com/ubaniak/scoreboard/internal/running/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/running/round/entities"
	"github.com/ubaniak/scoreboard/internal/running/scores"
)

// RosterAvailability lets bouts flip an athlete's per-card roster availability without importing
// roster directly (roster also depends on bouts, to check whether an athlete is currently matched
// before allowing removal, so this side of the relationship is wired post-construction via
// SetRosterAvailability to avoid an import cycle).
type RosterAvailability interface {
	SetAvailable(cardID, athleteID uint, available bool) error
}

// UseCase covers bout matchmaking: creating, pairing, editing, and removing bouts on a card.
// Live progression of a bout through its rounds to a decision lives in running/boutrunner,
// which shares this package's Storage and Bout entity.
type UseCase interface {
	Create(cardId uint, bout *entities.Bout) error
	CreateBulk(cardId uint, bouts []*entities.Bout) error
	Update(cardId, id uint, bout *entities.UpdateBout) error
	List(cardId uint) ([]*entities.Bout, error)
	Get(cardId, boutId uint) (*entities.Bout, []*roundEntities.RoundDetails, []string, error)
	Delete(cardId, id uint) error
}

type useCase struct {
	storage      Storage
	roundUseCase round.UseCase
	comments     comment.UseCase
	score        scores.UseCase
	roster       RosterAvailability
}

func NewUseCase(storage Storage, roundUseCase round.UseCase, comments comment.UseCase, score scores.UseCase) UseCase {
	return &useCase{storage: storage, roundUseCase: roundUseCase, comments: comments, score: score}
}

// SetRosterAvailability wires the roster dependency after construction.
func SetRosterAvailability(uc UseCase, roster RosterAvailability) {
	if u, ok := uc.(*useCase); ok {
		u.roster = roster
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

	if uc.roster != nil {
		if bout.RedAthleteID != nil {
			if err := uc.roster.SetAvailable(cardId, *bout.RedAthleteID, false); err != nil {
				return err
			}
		}
		if bout.BlueAthleteID != nil {
			if err := uc.roster.SetAvailable(cardId, *bout.BlueAthleteID, false); err != nil {
				return err
			}
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
	var current *entities.Bout
	athleteChanging := bout.RedAthleteID != nil || bout.BlueAthleteID != nil
	if bout.NumberOfJudges != nil || (uc.roster != nil && athleteChanging) {
		var err error
		current, err = uc.storage.Get(cardId, id)
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

	if uc.roster != nil && current != nil {
		if err := uc.flipAthlete(cardId, current.RedAthleteID, bout.RedAthleteID); err != nil {
			return err
		}
		if err := uc.flipAthlete(cardId, current.BlueAthleteID, bout.BlueAthleteID); err != nil {
			return err
		}
	}
	return nil
}

// flipAthlete restores the old athlete to available (if the corner is changing/clearing) and
// marks the new athlete unavailable (if one is being set). newAthleteID is **uint per
// entities.UpdateBout's nil-vs-clear-vs-set convention: nil means unchanged.
func (uc *useCase) flipAthlete(cardId uint, oldAthleteID *uint, newAthleteID **uint) error {
	if newAthleteID == nil {
		return nil
	}
	next := *newAthleteID
	if oldAthleteID != nil && (next == nil || *oldAthleteID != *next) {
		if err := uc.roster.SetAvailable(cardId, *oldAthleteID, true); err != nil {
			return err
		}
	}
	if next != nil {
		if err := uc.roster.SetAvailable(cardId, *next, false); err != nil {
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
	if uc.roster != nil {
		if current, err := uc.storage.Get(cardId, id); err == nil {
			if current.RedAthleteID != nil {
				_ = uc.roster.SetAvailable(cardId, *current.RedAthleteID, true)
			}
			if current.BlueAthleteID != nil {
				_ = uc.roster.SetAvailable(cardId, *current.BlueAthleteID, true)
			}
		}
	}
	return uc.storage.Delete(cardId, id)
}

