package roster

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/creation/athletes"
	"github.com/ubaniak/scoreboard/internal/creation/roster/entities"
)

// ErrAthleteMatched is returned when an admin tries to remove or mark unavailable
// an athlete who is currently red/blue on an active bout for the card.
var ErrAthleteMatched = errors.New("athlete is currently matched into a bout on this card; remove them from the bout first")

// BoutAthleteQuerier lets roster check whether an athlete is actively assigned to a bout,
// without roster importing bouts directly — bouts also depends on roster (to flip availability
// on match/unmatch), so this side of the relationship is wired post-construction via SetBoutQuerier
// to avoid an import cycle.
type BoutAthleteQuerier interface {
	IsAthleteMatched(cardID, athleteID uint) (bool, error)
}

type UseCase interface {
	Add(cardID, athleteID uint) error
	Remove(cardID, athleteID uint) error
	// SetAvailable is the low-level, unguarded flip — used internally by bout create/update/delete
	// to keep availability in sync with matching. Not guarded against ErrAthleteMatched, since
	// setting an athlete unavailable *because* they were just matched is exactly the expected flow.
	SetAvailable(cardID, athleteID uint, available bool) error
	// ToggleAvailable is the admin-facing action — guarded against ErrAthleteMatched when
	// setting available=false, since manually hiding a matched athlete would desync the bout.
	ToggleAvailable(cardID, athleteID uint, available bool) error
	ListForCard(cardID uint) ([]entities.RosterEntry, error)
	IsAvailable(cardID, athleteID uint) (bool, error)
}

type useCase struct {
	storage     Storage
	athletes    athletes.UseCase
	boutQuerier BoutAthleteQuerier
}

func NewUseCase(storage Storage, athleteUseCase athletes.UseCase) UseCase {
	return &useCase{storage: storage, athletes: athleteUseCase}
}

// SetBoutQuerier wires the bout-lookup dependency after construction.
func SetBoutQuerier(uc UseCase, q BoutAthleteQuerier) {
	if u, ok := uc.(*useCase); ok {
		u.boutQuerier = q
	}
}

func (uc *useCase) guardNotMatched(cardID, athleteID uint) error {
	if uc.boutQuerier == nil {
		return nil
	}
	matched, err := uc.boutQuerier.IsAthleteMatched(cardID, athleteID)
	if err != nil {
		return err
	}
	if matched {
		return ErrAthleteMatched
	}
	return nil
}

func (uc *useCase) Add(cardID, athleteID uint) error {
	if _, err := uc.athletes.Get(athleteID); err != nil {
		return err
	}
	return uc.storage.Add(cardID, athleteID)
}

func (uc *useCase) Remove(cardID, athleteID uint) error {
	if err := uc.guardNotMatched(cardID, athleteID); err != nil {
		return err
	}
	return uc.storage.Remove(cardID, athleteID)
}

func (uc *useCase) SetAvailable(cardID, athleteID uint, available bool) error {
	return uc.storage.SetAvailable(cardID, athleteID, available)
}

func (uc *useCase) ToggleAvailable(cardID, athleteID uint, available bool) error {
	if !available {
		if err := uc.guardNotMatched(cardID, athleteID); err != nil {
			return err
		}
	}
	return uc.storage.SetAvailable(cardID, athleteID, available)
}

func (uc *useCase) IsAvailable(cardID, athleteID uint) (bool, error) {
	entry, err := uc.storage.Get(cardID, athleteID)
	if err != nil {
		return false, err
	}
	return entry.Available, nil
}

func (uc *useCase) ListForCard(cardID uint) ([]entities.RosterEntry, error) {
	entries, err := uc.storage.ListForCard(cardID)
	if err != nil {
		return nil, err
	}
	result := make([]entities.RosterEntry, len(entries))
	for i, e := range entries {
		result[i] = e
		if a, err := uc.athletes.Get(e.AthleteID); err == nil {
			result[i].AthleteName = a.Name
			result[i].Gender = a.Gender
			result[i].AgeCategory = a.AgeCategory
			result[i].Experience = a.Experience
			result[i].WeightClass = a.WeightClass
		}
	}
	return result, nil
}
