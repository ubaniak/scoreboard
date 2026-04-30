package reports

import (
	"net/http"

	"github.com/gorilla/mux"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

// RegisterRoutes wires report endpoints under the provided subrouter.
// Expected to be called with rb already scoped to /api/cards/{id}/reports.
func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("reports.full.csv",        "/full/csv",        "GET", a.FullCSV,        rbac.Admin)
	rb.AddRoute("reports.full.pdf",        "/full/pdf",        "GET", a.FullPDF,        rbac.Admin)
	rb.AddRoute("reports.public.csv",      "/public/csv",      "GET", a.PublicCSV,      rbac.Admin)
	rb.AddRoute("reports.public.pdf",      "/public/pdf",      "GET", a.PublicPDF,      rbac.Admin)
	rb.AddRoute("reports.consistency.short.csv", "/consistency/short/csv", "GET", a.ConsistencyShortCSV, rbac.Admin)
	rb.AddRoute("reports.consistency.short.pdf", "/consistency/short/pdf", "GET", a.ConsistencyShortPDF, rbac.Admin)
	rb.AddRoute("reports.consistency.full.csv",  "/consistency/full/csv",  "GET", a.ConsistencyFullCSV,  rbac.Admin)
	rb.AddRoute("reports.consistency.full.pdf",  "/consistency/full/pdf",  "GET", a.ConsistencyFullPDF,  rbac.Admin)
}

func (a *App) consistencyData(w http.ResponseWriter, r *http.Request) (*JudgeConsistencyData, bool) {
	id, err := a.cardId(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return nil, false
	}
	d, err := a.useCase.JudgeConsistencyReport(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return nil, false
	}
	return d, true
}

func (a *App) ConsistencyShortCSV(w http.ResponseWriter, r *http.Request) {
	d, ok := a.consistencyData(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"judge_consistency_short.csv\"")
	WriteShortConsistencyCSV(w, d)
}

func (a *App) ConsistencyShortPDF(w http.ResponseWriter, r *http.Request) {
	d, ok := a.consistencyData(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"judge_consistency_short.pdf\"")
	WriteShortConsistencyPDF(w, d)
}

func (a *App) ConsistencyFullCSV(w http.ResponseWriter, r *http.Request) {
	d, ok := a.consistencyData(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=\"judge_consistency_full.csv\"")
	WriteFullConsistencyCSV(w, d)
}

func (a *App) ConsistencyFullPDF(w http.ResponseWriter, r *http.Request) {
	d, ok := a.consistencyData(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\"judge_consistency_full.pdf\"")
	WriteFullConsistencyPDF(w, d)
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

