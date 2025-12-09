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

type GetResponse struct {
	ID                 uint    `json:"id"`
	BoutNumber         int     `json:"boutNumber"`
	RedCorner          string  `json:"redCornder"`
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

func EntityToGetBoutResponse(entity *entities.Bout) *GetResponse {
	return &GetResponse{
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
	ID                 uint    `json:"id"`
	BoutNumber         int     `json:"boutNumber"`
	RedCorner          string  `json:"redCornder"`
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

func UpdateRequestToEntity(cardId uint, req *UpdateRequest) *entities.Bout {
	ageCategory := entities.AgeCategory(req.AgeCategory)
	experience := entities.Experience(req.Experience)
	gender := entities.Gender(req.Gender)

	roundLength := RoundLength(ageCategory, experience)
	gloveSize := GloveSize(req.WeightClass, ageCategory, gender)

	return &entities.Bout{
		ID:                 req.ID,
		CardID:             cardId,
		BoutNumber:         req.BoutNumber,
		RedCorner:          req.RedCorner,
		BlueCorner:         req.BlueCorner,
		Gender:             gender,
		WeightClass:        req.WeightClass,
		GloveSize:          gloveSize,
		RoundLength:        roundLength,
		AgeCategory:        ageCategory,
		Experience:         experience,
		RedCornerImageUrl:  req.RedCornerImageUrl,
		BlueCornerImageUrl: req.BlueCornerImageUrl,
		Status:             entities.BoutStatus(req.Status),
	}

}
