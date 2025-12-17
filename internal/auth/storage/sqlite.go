package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/auth/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type Sqlite struct {
	db *gorm.DB
}

type Profile struct {
	gorm.Model
	ID         uint   `gorm:"primaryKey"`
	Role       string `gorm:"uniqueIndex"`
	Limit      int    `gorm:"default:0"`
	HashedCode string
	JWTToken   string
	Count      int `gorm:"default:0"`
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {

	if err := db.AutoMigrate(&Profile{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) Save(profile *entities.Profile) error {
	p := Profile{
		ID:         uint(profile.ID),
		Role:       profile.Role,
		Limit:      profile.Limit,
		HashedCode: profile.HashedCode,
		JWTToken:   profile.JWTToken,
		Count:      profile.Count,
	}

	return s.db.Save(&p).Error
}

func (s *Sqlite) Get(role string) (*entities.Profile, error) {
	var profile Profile
	err := s.db.Where("role = ?", role).First(&profile).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, sberrs.ErrRecordNotFound
		}
		return nil, err
	}

	return &entities.Profile{
		ID:         uint(profile.ID),
		Role:       profile.Role,
		Limit:      profile.Limit,
		HashedCode: profile.HashedCode,
		JWTToken:   profile.JWTToken,
		Count:      profile.Count,
	}, nil
}

func (s *Sqlite) GetByToken(jwtToken string) (*entities.Profile, error) {
	var profile Profile
	err := s.db.Where("jwt_token = ?", jwtToken).First(&profile).Error
	if err != nil {
		return nil, err
	}

	return &entities.Profile{
		ID:         uint(profile.ID),
		Role:       profile.Role,
		Limit:      profile.Limit,
		HashedCode: profile.HashedCode,
		JWTToken:   profile.JWTToken,
		Count:      profile.Count,
	}, nil
}
