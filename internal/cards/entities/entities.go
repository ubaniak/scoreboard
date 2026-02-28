package entities

type CardStatus string

const (
	CardStatusUpComing   = "upcoming"
	CardStatusInProgress = "in_progress"
	CardStatusCancelled  = "cancelled"
	CardStatusComplete   = "complete"
)

type Card struct {
	ID     uint
	Name   string
	Date   string
	Status CardStatus
}

type UpdateCard struct {
	Name   *string
	Date   *string
	Status *string
}
