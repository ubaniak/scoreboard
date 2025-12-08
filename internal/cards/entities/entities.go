package entities

type Card struct {
	ID       uint
	Name     string
	Date     string
	Settings *Settings
}

type Settings struct {
	NumberOfJudges int
}

type Official struct {
	ID   uint
	Name string
}
