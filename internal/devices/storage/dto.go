package storage

import (
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/devices/entities"
)

type StatusProfile struct {
	gorm.Model
	ID              uint
	Role            string
	Status          string
	LastHealthCheck string
}

func EntityToModel(e *entities.StatusProfile) *StatusProfile {
	return &StatusProfile{
		ID:              e.ID,
		Role:            e.Role,
		Status:          string(e.Status),
		LastHealthCheck: "",
	}
}

func ModelToEntity(m *StatusProfile) *entities.StatusProfile {
	return &entities.StatusProfile{
		ID:     m.ID,
		Role:   m.Role,
		Status: entities.DeviceStatus(m.Status),
	}
}
