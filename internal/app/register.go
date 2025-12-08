package app

import "github.com/ubaniak/scoreboard/internal/rbac"

type Register struct {
	apps []App
}

func NewRegister() *Register {
	return &Register{
		apps: []App{},
	}
}

func (r *Register) Add(app App) {
	r.apps = append(r.apps, app)
}

func (r *Register) Register(rb *rbac.RouteBuilder) {
	for _, app := range r.apps {
		app.RegisterRoutes(rb)
	}
}
