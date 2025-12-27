package bouts

import (
	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
)

type UseCase interface {
	Create(cardId uint, bout *entities.Bout) error
	Update(cardId, id uint, bout *entities.UpdateBout) error
	List(cardId uint) ([]*entities.Bout, error)
	Get(cardId, boutId uint) (*entities.Bout, error)
	Delete(cardId, id uint) error
	UpdateStatus(cardId, boutId uint, status entities.BoutStatus) error
	// round funcs
	ListRounds(boutId uint) ([]*roundEntities.Round, error)
	GetRound(cardId, boutId uint, roundNumber int) (*roundEntities.RoundDetails, error)
	AddFoul(rf *roundEntities.RoundFoul) error
	EightCount(boutId uint, roundNumber int, corner string, direction string) error
	Fouls() ([]string, error)
	StartRound(boutId uint, roundNumber int) error
	ScoreRound(boutId uint, roundNumber int) error
	EndRound(cardId, boutId uint, roundNumber int) error
}

type useCase struct {
	storage      Storage
	roundUseCase round.UseCase
}

func NewUseCase(storage Storage, roundUseCase round.UseCase) UseCase {
	return &useCase{storage: storage, roundUseCase: roundUseCase}
}

func (uc *useCase) Create(cardId uint, bout *entities.Bout) error {
	boutId, err := uc.storage.Save(cardId, bout)
	if err != nil {
		return err
	}
	return uc.roundUseCase.CreateRounds(boutId)
}

func (uc *useCase) Update(cardId, id uint, bout *entities.UpdateBout) error {
	return uc.storage.Update(cardId, id, bout)
}

func (uc *useCase) List(cardId uint) ([]*entities.Bout, error) {
	return uc.storage.List(cardId)
}

func (uc *useCase) Get(cardId, boutId uint) (*entities.Bout, error) {
	return uc.storage.Get(cardId, boutId)
}

func (uc *useCase) Delete(cardId, id uint) error {
	return uc.storage.Delete(cardId, id)
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

func (uc *useCase) EightCount(boutId uint, roundNumber int, corner string, direction string) error {
	return uc.roundUseCase.EightCount(boutId, roundNumber, corner, direction)
}

func (uc *useCase) StartRound(boutId uint, roundNumber int) error {
	return uc.roundUseCase.Start(boutId, roundNumber)
}

func (uc *useCase) EndRound(cardId, boutId uint, roundNumber int) error {
	return uc.roundUseCase.End(boutId, roundNumber)
}

func (uc *useCase) ScoreRound(boutId uint, roundNumber int) error {
	return uc.roundUseCase.Score(boutId, roundNumber)
}
