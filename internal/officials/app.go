package officials

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/officials/entities"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("officials")
	allowedRoles := append([]string{rbac.Admin}, rbac.JudgeList...)
	sr.AddRoute("official.list", "", "GET", a.List, allowedRoles...)
	sr.AddRoute("official.create", "", "POST", a.Create, rbac.Admin)
	sr.AddRoute("official.import", "/import", "POST", a.ImportCSV, rbac.Admin)
	sr.AddRoute("official.update", "/{id}", "PUT", a.Update, rbac.Admin)
	sr.AddRoute("official.delete", "/{id}", "DELETE", a.Delete, rbac.Admin)
}

type CreateOfficialRequest struct {
	Name               string `json:"name"`
	Nationality        string `json:"nationality"`
	Gender             string `json:"gender"`
	YearOfBirth        int    `json:"yearOfBirth"`
	RegistrationNumber string `json:"registrationNumber"`
	Province           string `json:"province"`
	Nation             string `json:"nation"`
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)

	var createReq CreateOfficialRequest
	err := json.NewDecoder(r.Body).Decode(&createReq)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Create(&entities.Official{
		Name:               createReq.Name,
		Nationality:        createReq.Nationality,
		Gender:             createReq.Gender,
		YearOfBirth:        createReq.YearOfBirth,
		RegistrationNumber: createReq.RegistrationNumber,
		Province:           createReq.Province,
		Nation:             createReq.Nation,
	})
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type ListOfficialResponse struct {
	ID                 uint   `json:"id"`
	Name               string `json:"name"`
	Nationality        string `json:"nationality,omitempty"`
	Gender             string `json:"gender,omitempty"`
	YearOfBirth        int    `json:"yearOfBirth,omitempty"`
	RegistrationNumber string `json:"registrationNumber,omitempty"`
	Province           string `json:"province,omitempty"`
	Nation             string `json:"nation,omitempty"`
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]ListOfficialResponse](r, w)

	officials, err := h.useCase.Get()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	response := make([]ListOfficialResponse, len(officials))
	for i, o := range officials {
		response[i] = ListOfficialResponse{
			ID:                 o.ID,
			Name:               o.Name,
			Nationality:        o.Nationality,
			Gender:             o.Gender,
			YearOfBirth:        o.YearOfBirth,
			RegistrationNumber: o.RegistrationNumber,
			Province:           o.Province,
			Nation:             o.Nation,
		}
	}

	presenter.WithData(response).Present()
}

type UpdateOfficialRequest struct {
	Name               string `json:"name"`
	Nationality        string `json:"nationality"`
	Gender             string `json:"gender"`
	YearOfBirth        int    `json:"yearOfBirth"`
	RegistrationNumber string `json:"registrationNumber"`
	Province           string `json:"province"`
	Nation             string `json:"nation"`
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	var req UpdateOfficialRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Update(id, &entities.Official{
		Name:               req.Name,
		Nationality:        req.Nationality,
		Gender:             req.Gender,
		YearOfBirth:        req.YearOfBirth,
		RegistrationNumber: req.RegistrationNumber,
		Province:           req.Province,
		Nation:             req.Nation,
	})
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) Delete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Delete(id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

// ImportCSV accepts a multipart form upload with a "file" field containing a CSV.
// Required columns: name. Optional: nationality, gender, yearOfBirth, registrationNumber
func (h *App) ImportCSV(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		presenter.WithError(errors.New("failed to parse multipart form")).Present()
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		presenter.WithError(errors.New("missing 'file' field in form")).Present()
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		presenter.WithError(errors.New("invalid CSV: " + err.Error())).Present()
		return
	}

	if len(records) < 2 {
		presenter.WithError(errors.New("CSV must contain a header row and at least one data row")).Present()
		return
	}

	header := records[0]
	colIndex := make(map[string]int, len(header))
	for i, col := range header {
		colIndex[col] = i
	}

	if _, ok := colIndex["name"]; !ok {
		presenter.WithError(errors.New("CSV missing required column: name")).Present()
		return
	}

	officials := make([]*entities.Official, 0, len(records)-1)
	for _, row := range records[1:] {
		o := &entities.Official{Name: row[colIndex["name"]]}
		if i, ok := colIndex["nationality"]; ok && i < len(row) {
			o.Nationality = row[i]
		}
		if i, ok := colIndex["gender"]; ok && i < len(row) {
			o.Gender = row[i]
		}
		if i, ok := colIndex["yearOfBirth"]; ok && i < len(row) && row[i] != "" {
			if v, parseErr := strconv.Atoi(row[i]); parseErr == nil {
				o.YearOfBirth = v
			}
		}
		if i, ok := colIndex["registrationNumber"]; ok && i < len(row) {
			o.RegistrationNumber = row[i]
		}
		if i, ok := colIndex["province"]; ok && i < len(row) {
			o.Province = row[i]
		}
		if i, ok := colIndex["nation"]; ok && i < len(row) {
			o.Nation = row[i]
		}
		officials = append(officials, o)
	}

	err = h.useCase.CreateBulk(officials)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}
