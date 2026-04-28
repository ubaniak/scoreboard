package entities

type Official struct {
	ID                   uint
	Name                 string
	Nationality          string
	Gender               string
	YearOfBirth          int
	RegistrationNumber   string
	ProvinceAffiliationID *uint
	NationAffiliationID  *uint
	Province             string // populated on read, not stored
	Nation               string // populated on read, not stored
}
