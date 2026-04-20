package entities

type CardStatus string

const (
	CardStatusUpComing   = "upcoming"
	CardStatusInProgress = "in_progress"
	CardStatusCancelled  = "cancelled"
	CardStatusComplete   = "complete"
)

type Card struct {
	ID                      uint
	Name                    string
	Date                    string
	Status                  CardStatus
	NumberOfJudges          int
	ImageUrl                string
	ShowCardImage           bool
	ShowAthleteImages       bool
	ShowClubImages          bool
	ShowOfficialAffiliation string
	ShowAthleteAffiliation  string
}

type UpdateCard struct {
	Name                    *string
	Date                    *string
	Status                  *string
	NumberOfJudges          *int
	ShowCardImage           *bool
	ShowAthleteImages       *bool
	ShowClubImages          *bool
	ShowOfficialAffiliation *string
	ShowAthleteAffiliation  *string
}
