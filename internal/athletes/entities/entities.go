package entities

type Athlete struct {
	ID          uint
	Name        string
	DateOfBirth string
	ClubID      *uint
	ClubName    string // populated on read, not stored
	ImageUrl    string
}

type UpdateAthlete struct {
	Name        *string
	DateOfBirth *string
	ClubID      **uint // nil = don't change; &nil = clear; &value = set
}
