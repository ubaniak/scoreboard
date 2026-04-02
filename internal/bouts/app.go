package bouts

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
	"github.com/ubaniak/scoreboard/internal/scores"
	scoreEntities "github.com/ubaniak/scoreboard/internal/scores/entities"
)

type App struct {
	useCase      UseCase
	roundUseCase round.UseCase
	scoreUseCase scores.UseCase
}

func NewApp(useCase UseCase, roundUseCase round.UseCase, scoreUseCase scores.UseCase) *App {
	return &App{useCase: useCase, roundUseCase: roundUseCase, scoreUseCase: scoreUseCase}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("fouls", "/{cardId}/fouls", "GET", a.ListFouls, rbac.Admin)

	rb.AddRoute("bouts.create", "/{cardId}/bouts", "POST", a.Create, rbac.Admin)
	rb.AddRoute("bouts.import", "/{cardId}/bouts/import", "POST", a.ImportCSV, rbac.Admin)
	rb.AddRoute("bouts.list", "/{cardId}/bouts", "GET", a.List, rbac.Admin)
	rb.AddRoute("bouts.get", "/{cardId}/bouts/{id}", "GET", a.Get, rbac.Admin)
	rb.AddRoute("bouts.update", "/{cardId}/bouts/{id}", "PUT", a.Update, rbac.Admin)
	rb.AddRoute("bouts.delete", "/{cardId}/bouts/{id}", "DELETE", a.Delete, rbac.Admin)
	rb.AddRoute("bouts.end", "/{cardId}/bouts/{id}/end", "POST", a.End, rbac.Admin)

	rb.AddRoute("bouts.status", "/{cardId}/bouts/{id}/status", "POST", a.UpdateStatus, rbac.Admin)

	rb.AddRoute("rounds.list", "/{cardId}/bouts/{id}/rounds", "GET", a.ListRounds, rbac.Admin)
	rb.AddRoute("rounds.get", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}", "GET", a.GetRound, rbac.Admin)
	rb.AddRoute("rounds.fouls", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/foul", "POST", a.HandleFoul, rbac.Admin)
	rb.AddRoute("rounds.eightcounts", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/eightcount", "POST", a.EightCounts, rbac.Admin)

	rb.AddRoute("rounds.next", "/{cardId}/bouts/{boutId}/rounds/next", "POST", a.NextRoundState, rbac.Admin)

	rb.AddRoute("rounds.score", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score", "POST", a.Score, rbac.JudgeList...)
	rb.AddRoute("rounds.score.complete", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score/complete", "POST", a.ScoreComplete, rbac.JudgeList...)

	allowedRoles := append([]string{rbac.Admin}, rbac.JudgeList...)
	rb.AddRoute("scores.list", "/{cardId}/bouts/{boutId}/scores", "GET", a.ListScores, allowedRoles...)
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var createReq CreateRequest
	err = json.NewDecoder(r.Body).Decode(&createReq)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if err = createReq.Validate(); err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := CreateRequestToEntity(cardId, &createReq)

	err = h.useCase.Create(cardId, bout)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]GetBoutResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bouts, err := h.useCase.List(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	resp := make([]GetBoutResponse, len(bouts))
	for i, b := range bouts {
		resp[i] = *EntityToGetBoutResponse(b, []*roundEntities.RoundDetails{})
	}

	presenter.WithData(resp).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetBoutResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	b, rounds, err := h.useCase.Get(cardId, id)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := EntityToGetBoutResponse(b, rounds)

	presenter.WithData(resp).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req UpdateRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if err = req.Validate(); err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := UpdateRequestToEntity(cardId, &req)

	err = h.useCase.Update(cardId, id, bout)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) Delete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Delete(cardId, id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type EndBoutRequest struct {
	Decision string `json:"decision"`
	Winner   string `json:"winner"`
	Comment  string `json:"comment"`
}

func (h *App) End(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req EndBoutRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.End(cardId, id, req.Winner, req.Decision, req.Comment)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func (h *App) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req UpdateStatusRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	status := entities.BoutStatus(req.Status)
	if !status.IsValid() {
		presenter.WithError(fmt.Errorf("invalid status %q", req.Status)).Present()
		return
	}

	err = h.useCase.UpdateStatus(cardId, id, status)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type ListRoundResponse struct {
	RoundNumber int    `json:"roundNumber"`
	Status      string `json:"status"`
}

func (h *App) ListRounds(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]ListRoundResponse](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	rounds, err := h.roundUseCase.List(id)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := make([]ListRoundResponse, len(rounds))
	for i, r := range rounds {
		resp[i] = ListRoundResponse{
			RoundNumber: r.RoundNumber,
			Status:      string(r.Status),
		}
	}

	presenter.WithData(resp).Present()
}

func (h *App) ListFouls(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]string](r, w)

	fouls, err := h.roundUseCase.ListFouls()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(fouls).Present()
}

type HandleFoulRequest struct {
	Corner string `json:"corner"`
	Type   string `json:"type"`
	Foul   string `json:"foul"`
	Action string `json:"action"`
}

func (h *App) HandleFoul(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req HandleFoulRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	roundFoul := &roundEntities.RoundFoul{
		BoutID:      boutId,
		RoundNumber: roundNumber,
		Corner:      roundEntities.Corner(req.Corner),
		Type:        roundEntities.FoulType(req.Type),
		Foul:        req.Foul,
	}

	if req.Action == "add" {
		err = h.roundUseCase.AddFoul(roundFoul)
	}
	if req.Action == "remove" {
		err = h.roundUseCase.RemoveFoul(roundFoul)
	}

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

type GetRoundResponse struct {
	BoutID      uint                  `json:"boutId"`
	RoundNumber int                   `json:"roundNumber"`
	Status      string                `json:"status"`
	Red         CornerDetailsResponse `json:"red"`
	Blue        CornerDetailsResponse `json:"blue"`
}

func EntityToGetRoundResponse(entity *roundEntities.RoundDetails) *GetRoundResponse {
	return &GetRoundResponse{
		BoutID:      entity.BoutID,
		RoundNumber: entity.RoundNumber,
		Status:      string(entity.Status),
		Red: CornerDetailsResponse{
			Warnings:    entity.Red.Warnings,
			Cautions:    entity.Red.Cautions,
			EightCounts: entity.Red.EightCounts,
		},
		Blue: CornerDetailsResponse{
			Warnings:    entity.Blue.Warnings,
			Cautions:    entity.Blue.Cautions,
			EightCounts: entity.Blue.EightCounts,
		},
	}
}

type CornerDetailsResponse struct {
	Warnings    []string `json:"warnings"`
	Cautions    []string `json:"cautions"`
	EightCounts int      `json:"eightCounts"`
}

func (h *App) GetRound(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetRoundResponse](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	roundDetails, err := h.roundUseCase.Get(boutId, roundNumber)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	resp := &GetRoundResponse{
		BoutID:      boutId,
		RoundNumber: roundNumber,
		Status:      string(roundDetails.Status),
		Red: CornerDetailsResponse{
			Warnings:    roundDetails.Red.Warnings,
			Cautions:    roundDetails.Red.Cautions,
			EightCounts: roundDetails.Red.EightCounts,
		},
		Blue: CornerDetailsResponse{
			Warnings:    roundDetails.Blue.Warnings,
			Cautions:    roundDetails.Blue.Cautions,
			EightCounts: roundDetails.Blue.EightCounts,
		},
	}

	presenter.WithData(resp).Present()
}

type EightCountRequest struct {
	Corner    string `json:"corner"`
	Direction string `json:"direction"`
}

func (h *App) EightCounts(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req EightCountRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.roundUseCase.EightCount(boutId, roundNumber, req.Corner, req.Direction)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

func (h *App) NextRoundState(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[int](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	currentRound, err := h.roundUseCase.Next(boutId)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(currentRound).Present()
}

type ScoreRequest struct {
	Red  int `json:"red"`
	Blue int `json:"blue"`
}

func (h *App) Score(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("unknown role")).Present()
		return
	}

	var req ScoreRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.scoreUseCase.Score(cardId, boutId, roundNumber, role, req.Red, req.Blue)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

func (h *App) ScoreComplete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("unknown role")).Present()
		return
	}

	err = h.scoreUseCase.Complete(cardId, boutId, roundNumber, role)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

type ScoreResponse struct {
	RoundNumber int     `json:"roundNumber"`
	JudgeRole   string  `json:"judgeRole"`
	JudgeName   *string `json:"judgeName,omitempty"`
	Red         int     `json:"red"`
	Blue        int     `json:"blue"`
	Status      *string `json:"status,omitempty"`
}

func scoreToResponse(s *scoreEntities.Score, isAdmin bool) ScoreResponse {
	resp := ScoreResponse{
		RoundNumber: s.RoundNumber,
		JudgeRole:   s.JudgeRole,
		Red:         s.Red,
		Blue:        s.Blue,
	}
	if isAdmin {
		resp.JudgeName = &s.JudgeName
		status := string(s.Status)
		resp.Status = &status
	}
	return resp
}

// ImportCSV accepts a multipart form upload with a "file" field containing a CSV.
// Expected CSV columns (with header row): red,blue,age,experience
// Bout numbers are assigned sequentially starting from 1.
// Optional columns: weightClass (int), gender (male/female) — defaults to 0 and "male".
func (h *App) ImportCSV(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

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

	// Build column index from header
	header := records[0]
	colIndex := make(map[string]int, len(header))
	for i, col := range header {
		colIndex[col] = i
	}

	for _, required := range []string{"red", "blue", "age", "experience"} {
		if _, ok := colIndex[required]; !ok {
			presenter.WithError(errors.New("CSV missing required column: " + required)).Present()
			return
		}
	}

	bouts := make([]*entities.Bout, 0, len(records)-1)
	for i, row := range records[1:] {
		red := row[colIndex["red"]]
		blue := row[colIndex["blue"]]
		ageCategory := entities.AgeCategory(row[colIndex["age"]])
		experience := entities.Experience(row[colIndex["experience"]])

		gender := entities.Gender(entities.Male)
		if idx, ok := colIndex["gender"]; ok && idx < len(row) {
			gender = entities.Gender(row[idx])
		}

		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid ageCategory %q", i+1, ageCategory)).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid experience %q", i+1, experience)).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid gender %q", i+1, gender)).Present()
			return
		}

		weightClass := 0
		if idx, ok := colIndex["weightClass"]; ok && idx < len(row) {
			if wc, parseErr := strconv.Atoi(row[idx]); parseErr == nil {
				weightClass = wc
			}
		}

		roundLength := RoundLength(ageCategory, experience)
		gloveSize := GloveSize(weightClass, ageCategory, gender)

		bouts = append(bouts, &entities.Bout{
			CardID:      cardId,
			BoutNumber:  i + 1,
			RedCorner:   red,
			BlueCorner:  blue,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			WeightClass: weightClass,
			RoundLength: roundLength,
			GloveSize:   gloveSize,
			Status:      entities.BoutStatusNotStarted,
		})
	}

	err = h.useCase.CreateBulk(cardId, bouts)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) ListScores(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[map[int][]ScoreResponse](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	role, _ := rbac.GetRoleFromCtx(r.Context())
	isAdmin := role == rbac.Admin

	scoreList, err := h.scoreUseCase.List(cardId, boutId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	sort.Slice(scoreList, func(i, j int) bool {
		return scoreList[i].JudgeRole < scoreList[j].JudgeRole
	})

	resp := make(map[int][]ScoreResponse)
	for _, s := range scoreList {
		resp[s.RoundNumber] = append(resp[s.RoundNumber], scoreToResponse(s, isAdmin))
	}

	presenter.WithData(resp).Present()
}
