package current

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/current/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type UseCase interface {
	Current() (*entities.Current, error)
}

type usecase struct {
	cards cards.UseCase
	bouts bouts.UseCase
}

func NewUseCase(cardsUseCase cards.UseCase, boutsUseCase bouts.UseCase) UseCase {
	return &usecase{cards: cardsUseCase, bouts: boutsUseCase}
}

func (u *usecase) Current() (*entities.Current, error) {
	var current entities.Current

	card, err := u.cards.Current()
	if err != nil {
		return nil, err
	}

	current.Card = &entities.CurrentCard{
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
		Number:      bout.BoutNumber,
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

	return &current, nil
}
