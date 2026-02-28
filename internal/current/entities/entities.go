package entities

type CurrentCardResponse struct {
	Name string `json:"name"`
}

type CurrentBoutResponse struct {
	BoutNumber  int    `json:"boutNumber"`
	RedCorner   string `json:"redCorner"`
	BlueCorner  string `json:"blueCorner"`
	Gender      string `json:"gender"`
	WeightClass int    `json:"weightClass"`
	GloveSize   string `json:"gloveSize"`
	RoundLength int    `json:"roundLength"`
	AgeCategory string `json:"ageCategory"`
	Experience  string `json:"experience"`
	Status      string `json:"status"`
}

type CurrentRoundResponse struct {
	RoundNumber int    `json:"roundNumber"`
	Status      string `json:"status"`
}

type CurrentResponse struct {
	Card  *CurrentCardResponse  `json:"card,omitempty"`
	Bout  *CurrentBoutResponse  `json:"bout,omitempty"`
	Round *CurrentRoundResponse `json:"round,omitempty"`
}

type CurrentCard struct {
	Name string
}

type CurrentBout struct {
	Number      int
	RedCorner   string
	BlueCorner  string
	Gender      string
	WeightClass int
	GloveSize   string
	RoundLength int
	AgeCategory string
	Experience  string
	Status      string
}

type CurrentRound struct {
	Number int
	Status string
}

type Current struct {
	Card  *CurrentCard
	Bout  *CurrentBout
	Round *CurrentRound
}
