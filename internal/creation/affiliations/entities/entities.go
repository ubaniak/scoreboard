package entities

type AffiliationType string

const (
	AffiliationTypeClub     AffiliationType = "club"
	AffiliationTypeProvince AffiliationType = "province"
	AffiliationTypeNation   AffiliationType = "nation"
	AffiliationTypeOther    AffiliationType = "other"
)

type Affiliation struct {
	ID       uint
	Name     string
	Type     AffiliationType
	ImageUrl string
}

type UpdateAffiliation struct {
	Name *string
	Type *AffiliationType
}
