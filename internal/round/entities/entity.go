package entities

type RoundStatus string

const (
	RoundStatusNotStarted        RoundStatus = "not_started"
	RoundStatusReady             RoundStatus = "ready"
	RoundStatusInProgress        RoundStatus = "in_progress"
	RoundStatusWaitingForResults RoundStatus = "waiting_for_results"
	RoundStatusScoreComplete     RoundStatus = "score_complete"
	RoundStatusComplete          RoundStatus = "complete"
)

type FoulType string

const (
	FoulTypeWarning FoulType = "warning"
	FoulTypeCaution FoulType = "caution"
)

type Corner string

const (
	Red  Corner = "red"
	Blue Corner = "blue"
)

type RoundDetails struct {
	BoutID      uint
	RoundNumber int
	Status      RoundStatus
	Red         CornerDetails
	Blue        CornerDetails
}

type CornerDetails struct {
	Warnings    []string
	Cautions    []string
	EightCounts int
}

type Round struct {
	BoutID          uint
	RoundNumber     int
	RedEightCounts  int
	BlueEightCounts int
	Status          RoundStatus
}

type ToUpdate struct {
	RedEightCounts  *int
	BlueEightCounts *int
	Status          *RoundStatus
}

type RoundFoul struct {
	BoutID      uint
	RoundNumber int
	Corner      Corner
	Type        FoulType
	Foul        string
}

type Score struct {
	BoutId      uint
	RoundNumber int
	JudgeNumber int
	Red         int
	Blue        int
}
