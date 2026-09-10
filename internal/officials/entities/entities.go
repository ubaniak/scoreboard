package entities

type OfficialLevel string

const (
	LevelClub   OfficialLevel = "club"
	LevelRegion OfficialLevel = "region"
	LevelOne    OfficialLevel = "level_1"
	LevelTwo    OfficialLevel = "level_2"
	LevelThree  OfficialLevel = "level_3"
	LevelFour   OfficialLevel = "level_4"
)

func (l OfficialLevel) IsValid() bool {
	switch l {
	case LevelClub, LevelRegion, LevelOne, LevelTwo, LevelThree, LevelFour:
		return true
	}
	return false
}

type Official struct {
	ID                    uint
	Name                  string
	Nationality           string
	Gender                string
	YearOfBirth           int
	RegistrationNumber    string
	Level                 OfficialLevel
	ProvinceAffiliationID *uint
	NationAffiliationID   *uint
	ClubAffiliationID     *uint
	Province              string // populated on read, not stored
	Nation                string // populated on read, not stored
	Club                  string // populated on read, not stored
}

// CardOfficial is a card↔official roster assignment: which capabilities this
// official is fulfilling on this specific card. Capabilities are scoped to
// the assignment, not the official — the same official can be Judge-only on
// one card and Judge+Ref on another.
type CardOfficial struct {
	CardID       uint
	OfficialID   uint
	CanJudge     bool
	CanRef       bool
	CanTimekeep  bool
	CanSupervise bool
}

// AssignedOfficial is an Official merged with their capabilities on a
// specific card, for roster list responses.
type AssignedOfficial struct {
	Official
	CanJudge     bool
	CanRef       bool
	CanTimekeep  bool
	CanSupervise bool
}
