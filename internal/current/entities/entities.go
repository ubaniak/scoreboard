package entities

type CurrentCardResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type CurrentBoutResponse struct {
	ID                   uint   `json:"id"`
	BoutNumber           int    `json:"boutNumber"`
	BoutType             string `json:"boutType"`
	RedCorner            string `json:"redCorner"`
	BlueCorner           string `json:"blueCorner"`
	Gender               string `json:"gender"`
	WeightClass          int    `json:"weightClass"`
	GloveSize            string `json:"gloveSize"`
	RoundLength          int    `json:"roundLength"`
	AgeCategory          string `json:"ageCategory"`
	Experience           string `json:"experience"`
	Status               string `json:"status"`
	Decision             string `json:"decision,omitempty"`
	Winner               string `json:"winner,omitempty"`
	RedClubName          string `json:"redClubName,omitempty"`
	BlueClubName         string `json:"blueClubName,omitempty"`
	RedAthleteImageUrl   string `json:"redAthleteImageUrl,omitempty"`
	BlueAthleteImageUrl  string `json:"blueAthleteImageUrl,omitempty"`
}

type CurrentScoreResponse struct {
	Red  int `json:"red"`
	Blue int `json:"blue"`
}

type CurrentWarningsResponse struct {
	Red  int `json:"red"`
	Blue int `json:"blue"`
}

type CurrentRoundResponse struct {
	RoundNumber int    `json:"roundNumber"`
	Status      string `json:"status"`
}

type CurrentResponse struct {
	Card     *CurrentCardResponse              `json:"card,omitempty"`
	Bout     *CurrentBoutResponse              `json:"bout,omitempty"`
	NextBout *CurrentBoutResponse              `json:"nextBout,omitempty"`
	Round    *CurrentRoundResponse             `json:"round,omitempty"`
	Scores   map[int][]CurrentScoreResponse    `json:"scores,omitempty"`
	Warnings map[int]*CurrentWarningsResponse  `json:"warnings,omitempty"`
}

type BoutListItemResponse struct {
	ID                  uint   `json:"id"`
	BoutNumber          int    `json:"boutNumber"`
	BoutType            string `json:"boutType"`
	RedCorner           string `json:"redCorner"`
	BlueCorner          string `json:"blueCorner"`
	Status              string `json:"status"`
	Winner              string `json:"winner,omitempty"`
	Decision            string `json:"decision,omitempty"`
	RedClubName         string `json:"redClubName,omitempty"`
	BlueClubName        string `json:"blueClubName,omitempty"`
	RedAthleteImageUrl  string `json:"redAthleteImageUrl,omitempty"`
	BlueAthleteImageUrl string `json:"blueAthleteImageUrl,omitempty"`
}

type BoutListResponse struct {
	Card  *CurrentCardResponse  `json:"card,omitempty"`
	Bouts []BoutListItemResponse `json:"bouts"`
}

type BoutListItem struct {
	ID                  uint
	Number              int
	BoutType            string
	RedCorner           string
	BlueCorner          string
	Status              string
	Winner              string
	Decision            string
	RedClubName         string
	BlueClubName        string
	RedAthleteImageUrl  string
	BlueAthleteImageUrl string
}

type BoutList struct {
	Card  *CurrentCard
	Bouts []BoutListItem
}

type CurrentCard struct {
	ID   uint
	Name string
}

type CurrentBout struct {
	ID                  uint
	Number              int
	BoutType            string
	RedCorner           string
	BlueCorner          string
	Gender              string
	WeightClass         int
	GloveSize           string
	RoundLength         int
	AgeCategory         string
	Experience          string
	Status              string
	Decision            string
	Winner              string
	RedClubName         string
	BlueClubName        string
	RedAthleteImageUrl  string
	BlueAthleteImageUrl string
}

type CurrentScore struct {
	Red  int
	Blue int
}

type CurrentWarnings struct {
	Red  int
	Blue int
}

type CurrentRound struct {
	Number int
	Status string
}

type Current struct {
	Card     *CurrentCard
	Bout     *CurrentBout
	NextBout *CurrentBout
	Round    *CurrentRound
	Scores   map[int][]CurrentScore
	Warnings map[int]*CurrentWarnings
}
