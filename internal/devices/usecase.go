package devices

import (
	"errors"
	"fmt"
	"net"

	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/devices/entities"
	"github.com/ubaniak/scoreboard/internal/rbac"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type UseCase interface {
	RegisterJudge(number int) (string, error)
	JudgeStatus() ([]entities.StatusProfile, error)
	RegisterAdmin() (string, error)
	LocalIp() string
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

func (uc *useCase) JudgeStatus() ([]entities.StatusProfile, error) {
	roles := []string{"judge1", "judge2", "judge3", "judge4", "judge5"}
	statusProfiles := make([]entities.StatusProfile, len(roles))
	for i, role := range roles {
		status := entities.DeviceStatusConnected
		p, err := uc.authUseCase.Get(role)
		if err != nil {
			if errors.Is(err, sberrs.ErrRecordNotFound) {
				status = entities.DeviceStatusUnknown
			} else {
				return nil, err
			}
		}
		if p != nil && p.JWTToken == "" {
			status = entities.DeviceStatusOffline
		}

		statusProfiles[i] = entities.StatusProfile{
			Role:   role,
			Status: status,
		}
	}
	return statusProfiles, nil
}

func (uc *useCase) RegisterJudge(number int) (string, error) {
	role := fmt.Sprintf("%s%d", rbac.Judge, number)
	return uc.register(role, 1)
}

func (uc *useCase) RegisterAdmin() (string, error) {
	return uc.register(rbac.Admin, 1)
}

func (uc *useCase) LocalIp() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return ""
}
