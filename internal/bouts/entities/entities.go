package entities

type BoutStatus string

const (
	BoutStatusNotStarted        BoutStatus = "not_started"
	BoutStatusInProgress        BoutStatus = "in_progress"
	BoutStatusWaitingForScores  BoutStatus = "waiting_for_scores"
	BoutStatusScoreComplete     BoutStatus = "score_complete"
	BoutStatusRest              BoutStatus = "rest"
	BoutStatusWaitingForDecision BoutStatus = "waiting_for_decision"
	BoutStatusDecisionMade      BoutStatus = "decision_made"
	BoutStatusCompleted         BoutStatus = "completed"
	BoutStatusCancelled         BoutStatus = "cancelled"
)

type BoutType string

const (
	BoutTypeSparring      BoutType = "sparring"
	BoutTypeDevelopmental BoutType = "developmental"
	BoutTypeScored        BoutType = "scored"
)

func (b BoutType) IsValid() bool {
	switch b {
	case BoutTypeSparring, BoutTypeDevelopmental, BoutTypeScored:
		return true
	}
	return false
}

type Experience string

const (
	Novice Experience = "novice"
	Open   Experience = "open"
)

type AgeCategory string

const (
	JuniorA AgeCategory = "juniorA"
	JuniorB AgeCategory = "juniorB"
	JuniorC AgeCategory = "juniorC"
	Youth   AgeCategory = "youth"
	Elite   AgeCategory = "elite"
	Masters AgeCategory = "masters"
)

type GloveSize string

const (
	TenOz     GloveSize = "10oz"
	TwelveOz  GloveSize = "12oz"
	SixteenOz GloveSize = "16oz"
)

type RoundLength float64

const (
	ThreeMinutes  RoundLength = 3.0
	TwoMinutes    RoundLength = 2.0
	OneMinute     RoundLength = 1.0
	OneHalfMinute RoundLength = 1.5
)

type Gender string

const (
	Male   = "male"
	Female = "female"
)

func (g Gender) IsValid() bool {
	return g == Male || g == Female
}

func (e Experience) IsValid() bool {
	return e == Novice || e == Open
}

func (a AgeCategory) IsValid() bool {
	switch a {
	case JuniorA, JuniorB, JuniorC, Youth, Elite, Masters:
		return true
	}
	return false
}

func (s BoutStatus) IsValid() bool {
	switch s {
	case BoutStatusNotStarted, BoutStatusInProgress,
		BoutStatusWaitingForScores, BoutStatusScoreComplete, BoutStatusRest,
		BoutStatusWaitingForDecision, BoutStatusDecisionMade,
		BoutStatusCompleted, BoutStatusCancelled:
		return true
	}
	return false
}

type Bout struct {
	ID                 uint
	CardID             uint
	BoutNumber         int
	RedCorner          string
	BlueCorner         string
	Gender             Gender
	WeightClass        int
	GloveSize          GloveSize
	RoundLength        RoundLength
	AgeCategory        AgeCategory
	Experience         Experience
	RedCornerImageUrl  string
	BlueCornerImageUrl string
	Status             BoutStatus
	Decision           string
	Winner             string
	NumberOfJudges     int
	Referee            string
	BoutType           BoutType
}

type UpdateBout struct {
	BoutNumber     *int
	RedCorner      *string
	BlueCorner     *string
	Gender         *Gender
	WeightClass    *int
	GloveSize      *GloveSize
	RoundLength    *RoundLength
	AgeCategory    *AgeCategory
	Experience     *Experience
	Decision       *string
	Winner         *string
	NumberOfJudges *int
	Referee        *string
	BoutType       *BoutType
}
