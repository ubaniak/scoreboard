package healthcheck

import (
	"net/http"

	"github.com/ubaniak/scoreboard/internal/rbac"
)

type HealthCheck struct{}

func NewHealthCheck() *HealthCheck {
	return &HealthCheck{}
}

func (hc *HealthCheck) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("hc", "/hc", "GET", hc.healthCheckHandler)
	rb.AddRoute("hc1", "/hc/1", "GET", hc.healthCheckHandler1, "admin")
	rb.AddRoute("hc2", "/hc/2", "GET", hc.healthCheckHandler2, "judge")
}

func (hc *HealthCheck) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	w.Write([]byte("OK"))
}

func (hc *HealthCheck) healthCheckHandler1(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	w.Write([]byte("OK 1"))
}
func (hc *HealthCheck) healthCheckHandler2(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	w.Write([]byte("OK 2"))
}
