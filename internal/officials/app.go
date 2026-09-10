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

// RegisterCardRoutes wires the card↔official roster endpoints. Expected to
// be called with rb already scoped to /api/cards/{id}/officials.
func (a *App) RegisterCardRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("card_officials.list", "", "GET", a.ListCardOfficials, rbac.Admin)
	rb.AddRoute("card_officials.assign", "/{officialId}", "POST", a.AssignToCard, rbac.Admin)
	rb.AddRoute("card_officials.remove", "/{officialId}", "DELETE", a.RemoveFromCard, rbac.Admin)
}

type CreateOfficialRequest struct {
	Name                  string `json:"name"`
	Nationality           string `json:"nationality"`
	Gender                string `json:"gender"`
	YearOfBirth           int    `json:"yearOfBirth"`
	RegistrationNumber    string `json:"registrationNumber"`
	Level                 string `json:"level"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId"`
	NationAffiliationID   *uint  `json:"nationAffiliationId"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId"`
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
		Name:                  createReq.Name,
		Nationality:           createReq.Nationality,
		Gender:                createReq.Gender,
		YearOfBirth:           createReq.YearOfBirth,
		RegistrationNumber:    createReq.RegistrationNumber,
		Level:                 entities.OfficialLevel(createReq.Level),
		ProvinceAffiliationID: createReq.ProvinceAffiliationID,
		NationAffiliationID:   createReq.NationAffiliationID,
		ClubAffiliationID:     createReq.ClubAffiliationID,
	})
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type ListOfficialResponse struct {
	ID                    uint   `json:"id"`
	Name                  string `json:"name"`
	Nationality           string `json:"nationality,omitempty"`
	Gender                string `json:"gender,omitempty"`
	YearOfBirth           int    `json:"yearOfBirth,omitempty"`
	RegistrationNumber    string `json:"registrationNumber,omitempty"`
	Level                 string `json:"level,omitempty"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId,omitempty"`
	Province              string `json:"province,omitempty"`
	NationAffiliationID   *uint  `json:"nationAffiliationId,omitempty"`
	Nation                string `json:"nation,omitempty"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId,omitempty"`
	Club                  string `json:"club,omitempty"`
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
			ID:                    o.ID,
			Name:                  o.Name,
			Nationality:           o.Nationality,
			Gender:                o.Gender,
			YearOfBirth:           o.YearOfBirth,
			RegistrationNumber:    o.RegistrationNumber,
			Level:                 string(o.Level),
			ProvinceAffiliationID: o.ProvinceAffiliationID,
			Province:              o.Province,
			NationAffiliationID:   o.NationAffiliationID,
			Nation:                o.Nation,
			ClubAffiliationID:     o.ClubAffiliationID,
			Club:                  o.Club,
		}
	}

	presenter.WithData(response).Present()
}

type UpdateOfficialRequest struct {
	Name                  string `json:"name"`
	Nationality           string `json:"nationality"`
	Gender                string `json:"gender"`
	YearOfBirth           int    `json:"yearOfBirth"`
	RegistrationNumber    string `json:"registrationNumber"`
	Level                 string `json:"level"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId"`
	NationAffiliationID   *uint  `json:"nationAffiliationId"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId"`
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
		Name:                  req.Name,
		Nationality:           req.Nationality,
		Gender:                req.Gender,
		YearOfBirth:           req.YearOfBirth,
		RegistrationNumber:    req.RegistrationNumber,
		Level:                 entities.OfficialLevel(req.Level),
		ProvinceAffiliationID: req.ProvinceAffiliationID,
		NationAffiliationID:   req.NationAffiliationID,
		ClubAffiliationID:     req.ClubAffiliationID,
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
// Required columns: name. Optional: nationality, gender, yearOfBirth,
// registrationNumber, level, provinceAffiliationId, nationAffiliationId, clubAffiliationId
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
		if i, ok := colIndex["level"]; ok && i < len(row) {
			o.Level = entities.OfficialLevel(row[i])
		}
		if i, ok := colIndex["provinceAffiliationId"]; ok && i < len(row) && row[i] != "" {
			if v, parseErr := strconv.ParseUint(row[i], 10, 64); parseErr == nil {
				id := uint(v)
				o.ProvinceAffiliationID = &id
			}
		}
		if i, ok := colIndex["nationAffiliationId"]; ok && i < len(row) && row[i] != "" {
			if v, parseErr := strconv.ParseUint(row[i], 10, 64); parseErr == nil {
				id := uint(v)
				o.NationAffiliationID = &id
			}
		}
		if i, ok := colIndex["clubAffiliationId"]; ok && i < len(row) && row[i] != "" {
			if v, parseErr := strconv.ParseUint(row[i], 10, 64); parseErr == nil {
				id := uint(v)
				o.ClubAffiliationID = &id
			}
		}
		officials = append(officials, o)
	}

	err = h.useCase.CreateBulk(officials)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (a *App) cardId(r *http.Request) (uint, error) {
	return muxutils.ParseVars[uint](mux.Vars(r), "id")
}

type AssignedOfficialResponse struct {
	ID                    uint   `json:"id"`
	Name                  string `json:"name"`
	Nationality           string `json:"nationality,omitempty"`
	Gender                string `json:"gender,omitempty"`
	YearOfBirth           int    `json:"yearOfBirth,omitempty"`
	RegistrationNumber    string `json:"registrationNumber,omitempty"`
	Level                 string `json:"level,omitempty"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId,omitempty"`
	Province              string `json:"province,omitempty"`
	NationAffiliationID   *uint  `json:"nationAffiliationId,omitempty"`
	Nation                string `json:"nation,omitempty"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId,omitempty"`
	Club                  string `json:"club,omitempty"`
	CanJudge              bool   `json:"canJudge"`
	CanRef                bool   `json:"canRef"`
	CanTimekeep           bool   `json:"canTimekeep"`
	CanSupervise          bool   `json:"canSupervise"`
}

func (a *App) ListCardOfficials(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]AssignedOfficialResponse](r, w)

	cardId, err := a.cardId(r)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	assigned, err := a.useCase.ListForCard(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	response := make([]AssignedOfficialResponse, len(assigned))
	for i, o := range assigned {
		response[i] = AssignedOfficialResponse{
			ID:                    o.ID,
			Name:                  o.Name,
			Nationality:           o.Nationality,
			Gender:                o.Gender,
			YearOfBirth:           o.YearOfBirth,
			RegistrationNumber:    o.RegistrationNumber,
			Level:                 string(o.Level),
			ProvinceAffiliationID: o.ProvinceAffiliationID,
			Province:              o.Province,
			NationAffiliationID:   o.NationAffiliationID,
			Nation:                o.Nation,
			ClubAffiliationID:     o.ClubAffiliationID,
			Club:                  o.Club,
			CanJudge:              o.CanJudge,
			CanRef:                o.CanRef,
			CanTimekeep:           o.CanTimekeep,
			CanSupervise:          o.CanSupervise,
		}
	}

	presenter.WithData(response).Present()
}

// AssignCardOfficialRequest capabilities are pointers so an omitted field can
// be defaulted independently of an explicit false — CanTimekeep defaults to
// true, the rest default to false. Re-assigning an official already on the
// roster overwrites their capabilities, which is how capabilities get edited.
type AssignCardOfficialRequest struct {
	CanJudge     *bool `json:"canJudge"`
	CanRef       *bool `json:"canRef"`
	CanTimekeep  *bool `json:"canTimekeep"`
	CanSupervise *bool `json:"canSupervise"`
}

func boolOrDefault(v *bool, def bool) bool {
	if v == nil {
		return def
	}
	return *v
}

func (a *App) AssignToCard(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := a.cardId(r)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	officialId, err := muxutils.ParseVars[uint](vars, "officialId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req AssignCardOfficialRequest
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}

	err = a.useCase.AssignToCard(cardId, officialId, entities.CardOfficial{
		CanJudge:     boolOrDefault(req.CanJudge, false),
		CanRef:       boolOrDefault(req.CanRef, false),
		CanTimekeep:  boolOrDefault(req.CanTimekeep, true),
		CanSupervise: boolOrDefault(req.CanSupervise, false),
	})
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (a *App) RemoveFromCard(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := a.cardId(r)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	officialId, err := muxutils.ParseVars[uint](vars, "officialId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = a.useCase.RemoveFromCard(cardId, officialId)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}
