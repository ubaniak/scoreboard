package entities

type CardStatus string

const (
	CardStatusUpComing   = "upcoming"
	CardStatusInProgress = "inProgress"
	CardStatusCancelled  = "cancelled"
	CardStatusComplete   = "complete"
)

type Card struct {
	ID             uint
	Name           string
	Date           string
	Status         CardStatus
	NumberOfJudges int
}

type UpdateCard struct {
	Name           *string
	Date           *string
	Status         *string
	NumberOfJudges *int
}
