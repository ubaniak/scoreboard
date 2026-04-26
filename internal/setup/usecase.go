package setup

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/devices"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type UseCase interface {
	IsSetupRequired() bool
	Setup() (string, error)
}

type useCase struct {
	authUC   auth.UseCase
	deviceUC devices.UseCase
}

func NewUseCase(authUC auth.UseCase, deviceUC devices.UseCase) UseCase {
	return &useCase{authUC: authUC, deviceUC: deviceUC}
}

func (uc *useCase) IsSetupRequired() bool {
	_, err := uc.authUC.Get("admin")
	return errors.Is(err, sberrs.ErrRecordNotFound)
}

func (uc *useCase) Setup() (string, error) {
	if !uc.IsSetupRequired() {
		return "", errors.New("application already initialized")
	}
	return uc.deviceUC.RegisterAdmin()
}
