package entities

type RosterEntry struct {
	ID        uint
	CardID    uint
	AthleteID uint
	Available bool
	// populated on read, not stored
	AthleteName string
	Gender      string
	AgeCategory string
	Experience  string
	WeightClass *float64
}
