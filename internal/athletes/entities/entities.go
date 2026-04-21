package entities

type Athlete struct {
	ID               uint
	Name             string
	AgeCategory      string
	Nationality      string
	ClubID           *uint
	ClubName         string // populated on read, not stored
	ClubImageUrl     string // populated on read, not stored
	ProvinceName     string
	ProvinceImageUrl string
	NationName       string
	NationImageUrl   string
	ImageUrl         string
}

type UpdateAthlete struct {
	Name             *string
	AgeCategory      *string
	Nationality      *string
	ClubID           **uint // nil = don't change; &nil = clear; &value = set
	ProvinceName     *string
	ProvinceImageUrl *string
	NationName       *string
	NationImageUrl   *string
}
