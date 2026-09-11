package devices

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/ubaniak/scoreboard/internal/devices/entities"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("devices")
	sr.AddRoute("baseUrl", "/baseurl", http.MethodGet, h.BaseUrl, rbac.Admin)
	sr.AddRoute("judges", "/judges", http.MethodGet, h.Judges, rbac.Admin)
	sr.AddRoute("announcers", "/announcers", http.MethodGet, h.Announcers, rbac.Admin)
	sr.AddRoute("code", "/code", http.MethodPost, h.Code, rbac.Admin)
	healthCheckRoles := append(append([]string{}, rbac.JudgeList...), rbac.AnnouncerList...)
	sr.AddRoute("healthCheck", "/healthcheck", http.MethodGet, h.JudgeHealthCheck, healthCheckRoles...)
}
func (h *App) BaseUrl(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)
	ip := h.useCase.LocalIp()
	presenter.WithData(ip).Present()
}

type JudgesResponse struct {
	Role   string `json:"role"`
	Code   string `json:"code"`
	Status string `json:"status"`
}

func (h *App) Judges(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]JudgesResponse](r, w)
	judges, err := h.useCase.Judges()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(toJudgesResponse(judges)).Present()
}

func (h *App) Announcers(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]JudgesResponse](r, w)
	announcers, err := h.useCase.Announcers()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(toJudgesResponse(announcers)).Present()
}

func toJudgesResponse(profiles []entities.JudgeProfile) []JudgesResponse {
	response := make([]JudgesResponse, len(profiles))
	for i, profile := range profiles {
		response[i] = JudgesResponse{
			Role:   profile.Role,
			Code:   profile.Code,
			Status: string(profile.Status),
		}
	}
	return response
}

type RegisterRequest struct {
	Role Role `json:"role"`
}

func (h *App) Code(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if !req.Role.Validate() {
		presenter.WithError(fmt.Errorf("unknown role %s", req.Role)).Present()
	}

	code, err := h.useCase.GenerateCode(req.Role, Limits[req.Role])

	presenter.WithError(err).WithData(code).Present()
}

func (h *App) JudgeHealthCheck(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("no role")).Present()
		return
	}

	if err := h.useCase.HealthCheck(role); err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(fmt.Sprintf("Hello %s", role)).Present()
}

func (h *App) TestAdmin(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("no role")).Present()
	}

	presenter.WithData(fmt.Sprintf("Hello %s", role)).Present()
}

func (h *App) TestScoreboard(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	presenter.WithData("scoreboard").Present()
}
