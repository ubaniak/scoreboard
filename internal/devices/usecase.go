package devices

import (
	"errors"
	"net"
	"time"

	"github.com/ubaniak/scoreboard/internal/auth"
	authEntities "github.com/ubaniak/scoreboard/internal/auth/entities"
	"github.com/ubaniak/scoreboard/internal/devices/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type UseCase interface {
	GenerateCode(role Role, number int) (string, error)
	Judges() ([]entities.JudgeProfile, error)
	RegisterAdmin() (string, error)
	LocalIp() string
	HealthCheck(role string) error
}

type useCase struct {
	authUseCase auth.UseCase
}

func NewUseCase(authUseCase auth.UseCase) UseCase {
	return &useCase{authUseCase: authUseCase}
}

func (uc *useCase) GenerateCode(role Role, limit int) (string, error) {
	code, err := uc.authUseCase.GenerateCode(string(role), limit)
	if err != nil {
		return "", err
	}
	return code, nil
}

func (uc *useCase) Judges() ([]entities.JudgeProfile, error) {
	statusProfiles := make([]entities.JudgeProfile, len(JudgeRoles))
	for i, role := range JudgeRoles {
		status := entities.DeviceStatusConnected
		var profile *authEntities.Profile
		profile, err := uc.authUseCase.Get(string(role))
		if err != nil {
			if errors.Is(err, sberrs.ErrRecordNotFound) {
				profile = &authEntities.Profile{
					Role:  string(role),
					Limit: Limits[role],
				}
			} else {
				return nil, err
			}
		}

		if profile.JWTToken == "" || profile.LastHealthCheck == nil || time.Since(*profile.LastHealthCheck) > 4*time.Second {
			status = entities.DeviceStatusOffline
		}

		statusProfiles[i] = entities.JudgeProfile{
			StatusProfile: entities.StatusProfile{
				Role:   string(role),
				Status: status,
			},
			Code: profile.Code,
		}
	}
	return statusProfiles, nil
}

func (uc *useCase) RegisterAdmin() (string, error) {
	return uc.GenerateCode(AdminRole, Limits[AdminRole])
}

func (uc *useCase) HealthCheck(role string) error {
	return uc.authUseCase.RecordHealthCheck(role)
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
