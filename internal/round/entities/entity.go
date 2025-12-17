package entities

type RoundStatus string

const (
	RoundStatusNotStarted        RoundStatus = "not_started"
	RoundStatusInProgress        RoundStatus = "in_progress"
	RoundStatusWaitingForResults RoundStatus = "waiting_for_results"
	RoundStatusComplete          RoundStatus = "complete"
)

type Round struct {
	BoutID          uint
	RoundNumber     int
	RedWarnings     []string
	BlueWarnings    []string
	RedCautions     []string
	BlueCautions    []string
	RedEightCounts  int
	BlueEightCounts int
	RedScore        int
	BlueScore       int
	Decision        string
	Status          RoundStatus
}
