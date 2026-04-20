package cards

import (
	"github.com/ubaniak/scoreboard/internal/cards/entities"
)

type UpdateCardRequest struct {
	Name              *string `json:"name,omitempty"`
	Date              *string `json:"date,omitempty"`
	Status            *string `json:"status,omitempty"`
	NumberOfJudges    *int    `json:"numberOfJudges,omitempty"`
	ShowCardImage     *bool   `json:"showCardImage,omitempty"`
	ShowAthleteImages *bool   `json:"showAthleteImages,omitempty"`
	ShowClubImages    *bool   `json:"showClubImages,omitempty"`
}

func UpdateCardRequestToEntity(r UpdateCardRequest) *entities.UpdateCard {
	return &entities.UpdateCard{
		Name:              r.Name,
		Date:              r.Date,
		Status:            r.Status,
		NumberOfJudges:    r.NumberOfJudges,
		ShowCardImage:     r.ShowCardImage,
		ShowAthleteImages: r.ShowAthleteImages,
		ShowClubImages:    r.ShowClubImages,
	}
}
