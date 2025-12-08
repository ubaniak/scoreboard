package entities

type Profile struct {
	ID         uint
	Role       string
	Limit      int
	HashedCode string
	JWTToken   string
	Count      int
}

func (p *Profile) IncrementCount() {
	p.Count++
}

func (p *Profile) ReachedLimit() bool {
	if p.Limit == 0 {
		return false
	}
	return p.Count >= p.Limit
}
