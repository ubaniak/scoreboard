package current

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/current/entities"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
	"github.com/ubaniak/scoreboard/internal/scores"
)

type UseCase interface {
	Current() (*entities.Current, error)
}

type usecase struct {
	cards  cards.UseCase
	bouts  bouts.UseCase
	scores scores.UseCase
}

func NewUseCase(cardsUseCase cards.UseCase, boutsUseCase bouts.UseCase, scoresUseCase scores.UseCase) UseCase {
	return &usecase{cards: cardsUseCase, bouts: boutsUseCase, scores: scoresUseCase}
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
			return &current, err
		}
		return nil, err
	}

	current.Bout = &entities.CurrentBout{
		ID:          bout.ID,
		Number:      bout.BoutNumber,
		BoutType:    string(bout.BoutType),
		RedCorner:   bout.RedCorner,
		BlueCorner:  bout.BlueCorner,
		Gender:      string(bout.Gender),
		WeightClass: bout.WeightClass,
		GloveSize:   string(bout.GloveSize),
		RoundLength: int(bout.RoundLength),
		AgeCategory: string(bout.AgeCategory),
		Experience:  string(bout.Experience),
		Status:      string(bout.Status),
	}

	round, err := u.bouts.CurrentRound(bout.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &current, err
		}
		return nil, err
	}

	current.Round = &entities.CurrentRound{
		Number: round.RoundNumber,
		Status: string(round.Status),
	}

	scores, err := u.scores.List(card.ID, bout.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &current, err
		}
		return nil, err
	}
	if len(scores) > 0 && ShouldShowScores(round) {
		current.Scores = make(map[int][]entities.CurrentScore)
		for _, s := range scores {
			current.Scores[s.RoundNumber] = append(current.Scores[s.RoundNumber], entities.CurrentScore{
				Red:  s.Red,
				Blue: s.Blue,
			})
		}
	}

	return &current, nil
}

func ShouldShowScores(round *roundEntities.Round) bool {
	if round.RoundNumber != 3 && round.Status == roundEntities.RoundStatusScoreComplete {
		return true
	}
	if round.RoundNumber == 3 && round.Status == roundEntities.RoundStatusComplete {
		return true
	}
	return false
}
