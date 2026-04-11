package entities

type ScoreStatus string

const (
	ScoreStatusNotStarted ScoreStatus = "not_started"
	ScoreStatusReady      ScoreStatus = "ready"
	ScoreStatusRequested  ScoreStatus = "requested"
	ScoreStatusComplete   ScoreStatus = "complete"
)

type Score struct {
	CardId      uint
	BoutNumber  int
	RoundNumber int
	JudgeRole   string
	JudgeName   string
	Red         int
	Blue        int
	Status      ScoreStatus
}
