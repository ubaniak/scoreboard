package cards

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/datadir"
	"github.com/ubaniak/scoreboard/internal/events"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
)

type App struct {
	useCase     UseCase
	boutsApp    *bouts.App
	broadcaster *events.Broadcaster
}

func NewApp(useCase UseCase, boutsApp *bouts.App, broadcaster *events.Broadcaster) *App {
	return &App{
		useCase:     useCase,
		boutsApp:    boutsApp,
		broadcaster: broadcaster,
	}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("cards")
	sr.AddRoute("current", "/current", "GET", h.Current)
	sr.AddRoute("list.cards", "", "GET", h.List, rbac.Admin)
	sr.AddRoute("create.cards", "", "POST", h.Create, rbac.Admin)
	sr.AddRoute("update.cards", "/{id}", "PUT", h.Update, rbac.Admin)
	sr.AddRoute("delete.cards", "/{id}", "DELETE", h.Delete, rbac.Admin)
	sr.AddRoute("get.card", "/{id}", "GET", h.Get, rbac.Admin)
	sr.AddRoute("image.cards", "/{id}/image", "POST", h.UploadImage, rbac.Admin)
	sr.AddRoute("image.cards.delete", "/{id}/image", "DELETE", h.RemoveImage, rbac.Admin)

	h.boutsApp.RegisterRoutes(sr)
}

type CreateCardRequest struct {
	Name string `json:"name"`
	Date string `json:"date"`
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)

	var req CreateCardRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = h.useCase.Create(req.Name, req.Date)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type GetCardResponse struct {
	Id             uint   `json:"id"`
	Name           string `json:"name"`
	Date           string `json:"date"`
	Status         string `json:"status"`
	NumberOfJudges int    `json:"numberOfJudges"`
	ImageUrl       string `json:"imageUrl,omitempty"`
}

func mapCardToResponse(card entities.Card) *GetCardResponse {
	numJudges := card.NumberOfJudges
	if numJudges == 0 {
		numJudges = 5
	}
	return &GetCardResponse{
		Id:             card.ID,
		Name:           card.Name,
		Date:           card.Date,
		Status:         string(card.Status),
		NumberOfJudges: numJudges,
		ImageUrl:       card.ImageUrl,
	}
}

func (h *App) Current(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[GetCardResponse](r, w)

	card, err := h.useCase.Current()

	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			presenter = presenter.WithStatusCode(http.StatusNotFound)
		}
		presenter.WithError(err).Present()
		return
	}

	response := mapCardToResponse(*card)
	presenter.WithData(*response).Present()
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]*GetCardResponse](r, w)
	cards, err := h.useCase.List()

	var response []*GetCardResponse
	for _, c := range cards {
		response = append(response, mapCardToResponse(c))
	}

	presenter.WithError(err).WithData(response).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetCardResponse](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	card, err := h.useCase.Get(id)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			presenter.WithStatusCode(http.StatusNotFound).WithError(err).Present()
			return
		}
		presenter.WithError(err).Present()
		return
	}

	response := mapCardToResponse(*card)

	presenter.WithError(err).WithData(response).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req UpdateCardRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	toUpdate := UpdateCardRequestToEntity(req)

	err = h.useCase.Update(id, toUpdate)
	if err == nil {
		h.broadcaster.Notify()
	}
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
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

func (h *App) RemoveImage(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	presenter.WithError(h.useCase.SetImageUrl(id, "")).Present()
}

func (h *App) UploadImage(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		presenter.WithError(errors.New("failed to parse form")).Present()
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		presenter.WithError(errors.New("missing 'image' field")).Present()
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	uploadsDir, err := datadir.UploadsDir()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	dir := filepath.Join(uploadsDir, "cards")
	if err := os.MkdirAll(dir, 0755); err != nil {
		presenter.WithError(err).Present()
		return
	}
	dst, err := os.Create(fmt.Sprintf("%s/%d%s", dir, id, ext))
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		presenter.WithError(err).Present()
		return
	}

	url := fmt.Sprintf("/uploads/cards/%d%s", id, ext)
	presenter.WithError(h.useCase.SetImageUrl(id, url)).Present()
}
