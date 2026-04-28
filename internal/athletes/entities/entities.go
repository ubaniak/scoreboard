package entities

type Athlete struct {
	ID                     uint
	Name                   string
	AgeCategory            string
	Nationality            string
	ClubAffiliationID      *uint
	ProvinceAffiliationID  *uint
	NationAffiliationID    *uint
	ClubName               string // populated on read, not stored
	ClubImageUrl           string // populated on read, not stored
	ProvinceName           string // populated on read, not stored
	ProvinceImageUrl       string // populated on read, not stored
	NationName             string // populated on read, not stored
	NationImageUrl         string // populated on read, not stored
	ImageUrl               string
}

type UpdateAthlete struct {
	Name                  *string
	AgeCategory           *string
	Nationality           *string
	ClubAffiliationID     **uint // nil = don't change; &nil = clear; &value = set
	ProvinceAffiliationID **uint // nil = don't change; &nil = clear; &value = set
	NationAffiliationID   **uint // nil = don't change; &nil = clear; &value = set
}
