package entities

import "time"

type Profile struct {
	ID              uint
	Role            string
	Limit           int
	Code            string
	JWTToken        string
	Count           int
	LastHealthCheck *time.Time
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
