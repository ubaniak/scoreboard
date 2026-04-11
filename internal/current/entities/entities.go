package entities

type CurrentCardResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type CurrentBoutResponse struct {
	ID          uint   `json:"id"`
	BoutNumber  int    `json:"boutNumber"`
	BoutType    string `json:"boutType"`
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

type CurrentScoreResponse struct {
	Red  int `json:"red"`
	Blue int `json:"blue"`
}

type CurrentRoundResponse struct {
	RoundNumber int    `json:"roundNumber"`
	Status      string `json:"status"`
}

type CurrentResponse struct {
	Card   *CurrentCardResponse              `json:"card,omitempty"`
	Bout   *CurrentBoutResponse              `json:"bout,omitempty"`
	Round  *CurrentRoundResponse             `json:"round,omitempty"`
	Scores map[int][]CurrentScoreResponse    `json:"scores,omitempty"`
}

type CurrentCard struct {
	ID   uint
	Name string
}

type CurrentBout struct {
	ID          uint
	Number      int
	BoutType    string
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

type CurrentScore struct {
	Red  int
	Blue int
}

type CurrentRound struct {
	Number int
	Status string
}

type Current struct {
	Card   *CurrentCard
	Bout   *CurrentBout
	Round  *CurrentRound
	Scores map[int][]CurrentScore
}
