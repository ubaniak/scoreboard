package current

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/bouts"
	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/current/entities"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
	"github.com/ubaniak/scoreboard/internal/scores"
)

type UseCase interface {
	Current() (*entities.Current, error)
	List() (*entities.BoutList, error)
}

// AthleteQuerier is a narrow interface to look up athlete info without
// importing the full athletes package (avoids circular dependencies).
type AthleteQuerier interface {
	GetAthleteInfo(athleteID uint) (clubName, imageUrl string)
}

// RoundDetailsQuerier fetches foul/warning details for a single round.
type RoundDetailsQuerier interface {
	Get(boutId uint, roundNumber int) (*roundEntities.RoundDetails, error)
}

type usecase struct {
	cards    cards.UseCase
	bouts    bouts.UseCase
	scores   scores.UseCase
	athletes AthleteQuerier
	rounds   RoundDetailsQuerier
}

func NewUseCase(cardsUseCase cards.UseCase, boutsUseCase bouts.UseCase, scoresUseCase scores.UseCase, athleteQuerier AthleteQuerier, roundQuerier RoundDetailsQuerier) UseCase {
	return &usecase{cards: cardsUseCase, bouts: boutsUseCase, scores: scoresUseCase, athletes: athleteQuerier, rounds: roundQuerier}
}

func (u *usecase) Current() (*entities.Current, error) {
	var current entities.Current

	card, err := u.cards.Current()
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &current, nil
		}
		return nil, err
	}

	current.Card = &entities.CurrentCard{
		ID:   card.ID,
		Name: card.Name,
	}

	bout, err := u.bouts.Current(card.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			// No active bout — find the next not_started one
			all, listErr := u.bouts.List(card.ID)
			if listErr == nil {
				for _, b := range all {
					if string(b.Status) == "not_started" {
						current.NextBout = &entities.CurrentBout{
							ID:          b.ID,
							Number:      b.BoutNumber,
							BoutType:    string(b.BoutType),
							RedCorner:   b.RedCorner,
							BlueCorner:  b.BlueCorner,
							Gender:      string(b.Gender),
							WeightClass: b.WeightClass,
							GloveSize:   string(b.GloveSize),
							RoundLength: int(b.RoundLength),
							AgeCategory: string(b.AgeCategory),
							Experience:  string(b.Experience),
							Status:      string(b.Status),
						}
						break
					}
				}
			}
			return &current, err
		}
		return nil, err
	}

	var redClub, blueClub, redImage, blueImage string
	if u.athletes != nil {
		if bout.RedAthleteID != nil {
			redClub, redImage = u.athletes.GetAthleteInfo(*bout.RedAthleteID)
		}
		if bout.BlueAthleteID != nil {
			blueClub, blueImage = u.athletes.GetAthleteInfo(*bout.BlueAthleteID)
		}
	}

	decisionRevealed := string(bout.Status) == "show_decision" || string(bout.Status) == "completed"

	currentBout := &entities.CurrentBout{
		ID:                  bout.ID,
		Number:              bout.BoutNumber,
		BoutType:            string(bout.BoutType),
		RedCorner:           bout.RedCorner,
		BlueCorner:          bout.BlueCorner,
		Gender:              string(bout.Gender),
		WeightClass:         bout.WeightClass,
		GloveSize:           string(bout.GloveSize),
		RoundLength:         int(bout.RoundLength),
		AgeCategory:         string(bout.AgeCategory),
		Experience:          string(bout.Experience),
		Status:              string(bout.Status),
		RedClubName:         redClub,
		BlueClubName:        blueClub,
		RedAthleteImageUrl:  redImage,
		BlueAthleteImageUrl: blueImage,
	}
	if decisionRevealed {
		currentBout.Decision = bout.Decision
		currentBout.Winner = bout.Winner
	}
	current.Bout = currentBout

	boutDecided := current.Bout.Status == "decision_made" || current.Bout.Status == "show_decision" || current.Bout.Status == "completed"
	scoresAllowed := decisionRevealed

	round, err := u.bouts.CurrentRound(bout.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			if !boutDecided {
				return &current, err
			}
			// No active round but bout is decided — fall through to fetch scores
		} else {
			return nil, err
		}
	}

	if round != nil {
		current.Round = &entities.CurrentRound{
			Number: round.RoundNumber,
			Status: string(round.Status),
		}
	}

	scores, err := u.scores.List(card.ID, bout.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &current, err
		}
		return nil, err
	}
	if len(scores) > 0 && (scoresAllowed || ShouldShowScores(round, bout)) {
		current.Scores = make(map[int][]entities.CurrentScore)
		for _, s := range scores {
			current.Scores[s.RoundNumber] = append(current.Scores[s.RoundNumber], entities.CurrentScore{
				Red:  s.Red,
				Blue: s.Blue,
			})
		}

		// Fetch warning counts for each round that has scores.
		if u.rounds != nil {
			current.Warnings = make(map[int]*entities.CurrentWarnings)
			for roundNum := range current.Scores {
				rd, err := u.rounds.Get(bout.ID, roundNum)
				if err == nil && rd != nil {
					redWarn := len(rd.Red.Warnings)
					blueWarn := len(rd.Blue.Warnings)
					if redWarn > 0 || blueWarn > 0 {
						current.Warnings[roundNum] = &entities.CurrentWarnings{
							Red:  redWarn,
							Blue: blueWarn,
						}
					}
				}
			}
			if len(current.Warnings) == 0 {
				current.Warnings = nil
			}
		}
	}

	return &current, nil
}

func (u *usecase) List() (*entities.BoutList, error) {
	card, err := u.cards.Current()
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &entities.BoutList{}, nil
		}
		return nil, err
	}

	result := &entities.BoutList{
		Card: &entities.CurrentCard{
			ID:   card.ID,
			Name: card.Name,
		},
	}

	bouts, err := u.bouts.List(card.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return result, nil
		}
		return nil, err
	}

	for _, b := range bouts {
		decisionRevealed := b.Status == boutEntities.BoutStatusShowDecision || b.Status == boutEntities.BoutStatusCompleted

		var redClub, blueClub, redImage, blueImage string
		if u.athletes != nil {
			if b.RedAthleteID != nil {
				redClub, redImage = u.athletes.GetAthleteInfo(*b.RedAthleteID)
			}
			if b.BlueAthleteID != nil {
				blueClub, blueImage = u.athletes.GetAthleteInfo(*b.BlueAthleteID)
			}
		}

		item := entities.BoutListItem{
			ID:                  b.ID,
			Number:              b.BoutNumber,
			BoutType:            string(b.BoutType),
			RedCorner:           b.RedCorner,
			BlueCorner:          b.BlueCorner,
			Status:              string(b.Status),
			WeightClass:         b.WeightClass,
			GloveSize:           string(b.GloveSize),
			RoundLength:         int(b.RoundLength),
			AgeCategory:         string(b.AgeCategory),
			Experience:          string(b.Experience),
			RedClubName:         redClub,
			BlueClubName:        blueClub,
			RedAthleteImageUrl:  redImage,
			BlueAthleteImageUrl: blueImage,
		}
		if decisionRevealed {
			item.Winner = b.Winner
			item.Decision = b.Decision
		}
		result.Bouts = append(result.Bouts, item)
	}

	return result, nil
}

func ShouldShowScores(round *roundEntities.Round, bout *boutEntities.Bout) bool {
	if round == nil {
		return false
	}

	if round.RoundNumber != 3 && round.Status == roundEntities.RoundStatusScoreComplete {
		return true
	}
	if round.RoundNumber == 3 && bout.Status == boutEntities.BoutStatusShowDecision {
		return true
	}
	return false
}
