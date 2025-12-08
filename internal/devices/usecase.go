package devices

import (
	"errors"
	"fmt"

	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/rbac"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type UseCase interface {
	RegisterJudge(number int) (string, error)
	RegisterAdmin() (string, error)
}

type useCase struct {
	authUseCase auth.UseCase
}

func NewUseCase(authUseCase auth.UseCase) UseCase {
	return &useCase{authUseCase: authUseCase}
}

func (uc *useCase) register(role string, limit int) (string, error) {
	_, err := uc.authUseCase.Get(role)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			code, err := uc.authUseCase.Register(role, limit)
			if err != nil {
				return "", err
			}
			return code, nil
		}
		return "", nil
	}

	return uc.authUseCase.InvalidateRole(role)
}

func (uc *useCase) RegisterJudge(number int) (string, error) {
	role := fmt.Sprintf("%s%d", rbac.Judge, number)
	return uc.register(role, 1)
}

func (uc *useCase) RegisterAdmin() (string, error) {
	return uc.register(rbac.Admin, 1)
}
