package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/ubaniak/scoreboard/internal/auth/entities"
	"github.com/ubaniak/scoreboard/internal/auth/utils"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

const CodeLength = 5

type UseCase interface {
	Register(role string, limit int) (string, error)
	Login(role, registrationCode string) (string, error)
	InvalidateRole(role string) (string, error)
	GetProfile(jwtToken string) (*entities.Profile, error)
	SetAdmin() (string, error)
}

type useCase struct {
	storage Storage
	signKey string
}

func NewUseCase(storage Storage, signKey string) UseCase {
	return &useCase{storage: storage, signKey: signKey}
}

func (uc *useCase) Register(role string, limit int) (string, error) {
	code, err := utils.GenerateCode(CodeLength)
	if err != nil {
		return "", err
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	profile := entities.Profile{
		Role:       role,
		Limit:      limit,
		HashedCode: string(hashed),
	}

	err = uc.storage.Save(profile)
	if err != nil {
		return "", err
	}
	return code, nil
}

func (uc *useCase) Login(role, code string) (string, error) {
	profile, err := uc.storage.Get(role)
	if err != nil {
		return "", err
	}

	if profile.ReachedLimit() {
		return "", errors.New("role has reached its limit")
	}

	profile.IncrementCount()

	if err := bcrypt.CompareHashAndPassword([]byte(profile.HashedCode), []byte(code)); err != nil {
		return "", err
	}

	token, err := utils.GenerateJWTToken(role, []byte(uc.signKey))
	if err != nil {
		return "", err
	}

	profile.JWTToken = token

	err = uc.storage.Save(profile)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (uc *useCase) InvalidateRole(role string) (string, error) {

	profile, err := uc.storage.Get(role)
	if err != nil {
		return "", err
	}

	code, err := utils.GenerateCode(CodeLength)
	if err != nil {
		return "", err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	profile.HashedCode = string(hashed)
	profile.JWTToken = ""
	profile.Count = 0

	err = uc.storage.Save(profile)
	if err != nil {
		return "", err
	}

	return code, nil
}

func (uc *useCase) GetProfile(jwtToken string) (*entities.Profile, error) {
	profile, err := uc.storage.GetByToken(jwtToken)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (uc *useCase) SetAdmin() (string, error) {

	_, err := uc.storage.Get("admin")
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			code, err := uc.Register("admin", 1)
			if err != nil {
				return "", err
			}
			return code, nil
		}
		return "", nil
	}

	return uc.InvalidateRole("admin")
}
