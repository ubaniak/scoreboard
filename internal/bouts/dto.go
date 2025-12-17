package bouts

import "github.com/ubaniak/scoreboard/internal/bouts/entities"

func RoundLength(ageCat entities.AgeCategory, experience entities.Experience) entities.RoundLength {
	if ageCat == entities.JuniorA {
		return entities.OneMinute
	}
	if ageCat == entities.JuniorB {
		return entities.OneHalfMinute
	}
	if ageCat == entities.Masters {
		return entities.OneHalfMinute
	}
	if experience == entities.Open {
		return entities.ThreeMinutes
	}
	return entities.TwoMinutes
}

func GloveSize(weightClass int, ageCat entities.AgeCategory, gender entities.Gender) entities.GloveSize {
	if gender == entities.Female {
		return entities.TenOz
	}
	if ageCat == entities.Masters {
		return entities.SixteenOz
	}
	if weightClass <= 70 {
		return entities.TenOz
	}
	return entities.TwelveOz
}

type CreateRequest struct {
	BoutNumber  int    `json:"boutNumber"`
	RedCorner   string `json:"redCorner"`
	BlueCorner  string `json:"blueCorner"`
	WeightClass int    `json:"weightClass"`
	AgeCategory string `json:"ageCategory"`
	Experience  string `json:"experience"`
	Gender      string `json:"gender"`
}

func CreateRequestToEntity(cardId uint, req *CreateRequest) *entities.Bout {
	ageCategory := entities.AgeCategory(req.AgeCategory)
	experience := entities.Experience(req.Experience)
	gender := entities.Gender(req.Gender)

	roundLength := RoundLength(ageCategory, experience)
	gloveSize := GloveSize(req.WeightClass, ageCategory, gender)

	return &entities.Bout{
		CardID:             cardId,
		BoutNumber:         req.BoutNumber,
		RedCorner:          req.RedCorner,
		BlueCorner:         req.BlueCorner,
		WeightClass:        req.WeightClass,
		GloveSize:          gloveSize,
		RoundLength:        roundLength,
		AgeCategory:        ageCategory,
		Experience:         experience,
		RedCornerImageUrl:  "",
		BlueCornerImageUrl: "",
		Status:             entities.BoutStatusNotStarted,
		Gender:             gender,
	}
}

type GetBoutResponse struct {
	ID                 uint    `json:"id"`
	BoutNumber         int     `json:"boutNumber"`
	RedCorner          string  `json:"redCorner"`
	BlueCorner         string  `json:"blueCorner"`
	Gender             string  `json:"gender"`
	WeightClass        int     `json:"weightClass"`
	GloveSize          string  `json:"gloveSize"`
	RoundLength        float64 `json:"roundLength"`
	AgeCategory        string  `json:"ageCategory"`
	Experience         string  `json:"experience"`
	RedCornerImageUrl  string  `json:"redCornerImageUrl"`
	BlueCornerImageUrl string  `json:"blueCornerImageUrl"`
	Status             string  `json:"status"`
}

func EntityToGetBoutResponse(entity *entities.Bout) *GetBoutResponse {
	return &GetBoutResponse{
		ID:                 entity.ID,
		BoutNumber:         entity.BoutNumber,
		RedCorner:          entity.RedCorner,
		BlueCorner:         entity.BlueCorner,
		Gender:             string(entity.Gender),
		WeightClass:        entity.WeightClass,
		GloveSize:          string(entity.GloveSize),
		RoundLength:        float64(entity.RoundLength),
		AgeCategory:        string(entity.AgeCategory),
		Experience:         string(entity.Experience),
		RedCornerImageUrl:  entity.RedCornerImageUrl,
		BlueCornerImageUrl: entity.BlueCornerImageUrl,
		Status:             string(entity.Status),
	}
}

type UpdateRequest struct {
	BoutNumber  *int     `json:"boutNumber"`
	RedCorner   *string  `json:"redCorner"`
	BlueCorner  *string  `json:"blueCorner"`
	Gender      *string  `json:"gender"`
	WeightClass *int     `json:"weightClass"`
	GloveSize   *string  `json:"gloveSize"`
	RoundLength *float64 `json:"roundLength"`
	AgeCategory *string  `json:"ageCategory"`
	Experience  *string  `json:"experience"`
}

func UpdateRequestToEntity(cardId uint, req *UpdateRequest) *entities.UpdateBout {
	var ageCategory *entities.AgeCategory = nil
	var experience *entities.Experience = nil
	var gender *entities.Gender = nil
	var roundLength *entities.RoundLength = nil
	var gloveSize *entities.GloveSize = nil

	if req.AgeCategory != nil {
		ageCategory = (*entities.AgeCategory)(req.AgeCategory)
	}
	if req.Experience != nil {
		experience = (*entities.Experience)(req.Experience)
	}
	if req.Gender != nil {
		gender = (*entities.Gender)(req.Gender)
	}
	if req.GloveSize != nil {
		gloveSize = (*entities.GloveSize)(req.GloveSize)
	}
	if req.RoundLength != nil {
		roundLength = (*entities.RoundLength)(req.RoundLength)
	}

	return &entities.UpdateBout{
		BoutNumber:  req.BoutNumber,
		RedCorner:   req.RedCorner,
		BlueCorner:  req.BlueCorner,
		Gender:      gender,
		WeightClass: req.WeightClass,
		GloveSize:   gloveSize,
		RoundLength: roundLength,
		AgeCategory: ageCategory,
		Experience:  experience,
	}

}
