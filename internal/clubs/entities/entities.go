package entities

type Club struct {
	ID       uint
	Name     string
	Location string
	ImageUrl string
}

type UpdateClub struct {
	Name     *string
	Location *string
}
