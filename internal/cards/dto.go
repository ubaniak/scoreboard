package cards

import (
	"github.com/ubaniak/scoreboard/internal/cards/entities"
)

type UpdateCardRequest struct {
	Name           *string `json:"name,omitempty"`
	Date           *string `json:"date,omitempty"`
	Status         *string `json:"status,omitempty"`
	NumberOfJudges *int    `json:"numberOfJudges,omitempty"`
}

func UpdateCardRequestToEntity(r UpdateCardRequest) *entities.UpdateCard {
	return &entities.UpdateCard{
		Name:           r.Name,
		Date:           r.Date,
		Status:         r.Status,
		NumberOfJudges: r.NumberOfJudges,
	}
}
