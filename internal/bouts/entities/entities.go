package entities

type BoutStatus string

const (
	BoutStatusNotStarted       BoutStatus = "not_started"
	BoutStatusReady            BoutStatus = "ready"
	BoutStatusInProgress       BoutStatus = "in_progress"
	BoutStatusWaitingForResult BoutStatus = "waiting_for_result"
	BoutStatusCompleted        BoutStatus = "completed"
	BoutStatusCancelled        BoutStatus = "cancelled"
)

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
}

type UpdateBout struct {
	BoutNumber  *int
	RedCorner   *string
	BlueCorner  *string
	Gender      *Gender
	WeightClass *int
	GloveSize   *GloveSize
	RoundLength *RoundLength
	AgeCategory *AgeCategory
	Experience  *Experience
}
