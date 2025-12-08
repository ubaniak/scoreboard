package app

import (
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App interface {
	RegisterRoutes(rb *rbac.RouteBuilder)
}
