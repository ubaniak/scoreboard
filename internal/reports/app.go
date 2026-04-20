package reports

import (
	"net/http"

	"github.com/gorilla/mux"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase *UseCase
}

func NewApp(useCase *UseCase) *App {
	return &App{useCase: useCase}
}

// RegisterRoutes wires report endpoints under the cards subrouter.
// Expected to be called with rb = cards subrouter so paths become
// /api/cards/{cardId}/reports/...
func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("reports")
	sr.AddRoute("reports.full.csv",        "/full/csv",        "GET", a.FullCSV,        rbac.Admin)
	sr.AddRoute("reports.full.pdf",        "/full/pdf",        "GET", a.FullPDF,        rbac.Admin)
	sr.AddRoute("reports.public.csv",      "/public/csv",      "GET", a.PublicCSV,      rbac.Admin)
	sr.AddRoute("reports.public.pdf",      "/public/pdf",      "GET", a.PublicPDF,      rbac.Admin)
	sr.AddRoute("reports.consistency.csv", "/consistency/csv", "GET", a.ConsistencyCSV, rbac.Admin)
	sr.AddRoute("reports.consistency.pdf", "/consistency/pdf", "GET", a.ConsistencyPDF, rbac.Admin)
}

func (a *App) cardId(r *http.Request) (uint, error) {
	return muxutils.ParseVars[uint](mux.Vars(r), "id")
}

func (a *App) FullCSV(w http.ResponseWriter, r *http.Request) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rd, err := a.useCase.FullReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"full_report.csv\"")
	WriteFullCSV(w, rd)
}

func (a *App) FullPDF(w http.ResponseWriter, r *http.Request) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rd, err := a.useCase.FullReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"full_report.pdf\"")
	WriteFullPDF(w, rd)
}

func (a *App) PublicCSV(w http.ResponseWriter, r *http.Request) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rd, err := a.useCase.PublicReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"public_report.csv\"")
	WritePublicCSV(w, rd)
}

func (a *App) PublicPDF(w http.ResponseWriter, r *http.Request) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	rd, err := a.useCase.PublicReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"public_report.pdf\"")
	WritePublicPDF(w, rd)
}

func (a *App) ConsistencyCSV(w http.ResponseWriter, r *http.Request) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	cr, err := a.useCase.ConsistencyReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"consistency_report.csv\"")
	WriteConsistencyCSV(w, cr)
}

func (a *App) ConsistencyPDF(w http.ResponseWriter, r *http.Request) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	cr, err := a.useCase.ConsistencyReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"consistency_report.pdf\"")
	WriteConsistencyPDF(w, cr)
}
