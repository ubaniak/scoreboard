package gdrive

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

// App exposes Google Drive integration endpoints.
type App struct {
	officials OfficialCreator
	clubs     ClubCreator
	athletes  AthleteCreator
	bouts     BoutCreator
	cards     CardFinderCreator
	reports   ReportBuilder
}

func NewApp(
	officials OfficialCreator,
	clubs ClubCreator,
	athletes AthleteCreator,
	bouts BoutCreator,
	cards CardFinderCreator,
	reports ReportBuilder,
) *App {
	return &App{
		officials: officials,
		clubs:     clubs,
		athletes:  athletes,
		bouts:     bouts,
		cards:     cards,
		reports:   reports,
	}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("gdrive")
	sr.AddRoute("gdrive.config.get", "/config", http.MethodGet, a.GetConfig, rbac.Admin)
	sr.AddRoute("gdrive.config.put", "/config", http.MethodPut, a.PutConfig, rbac.Admin)
	sr.AddRoute("gdrive.authurl", "/auth-url", http.MethodGet, a.GetAuthURL, rbac.Admin)
	sr.AddRoute("gdrive.disconnect", "/disconnect", http.MethodPost, a.Disconnect, rbac.Admin)
	sr.AddRoute("gdrive.import", "/import", http.MethodPost, a.Import, rbac.Admin)
	sr.AddRoute("gdrive.export", "/export/{cardId}", http.MethodPost, a.ExportCard, rbac.Admin)
	sr.AddRoute("gdrive.template", "/template", http.MethodPost, a.CreateTemplate, rbac.Admin)
	// Callback is public — Google redirects back here with the auth code.
	sr.AddRoute("gdrive.callback", "/callback", http.MethodGet, a.Callback)
}

func (a *App) GetConfig(w http.ResponseWriter, _ *http.Request) {
	cfg, err := loadConfig()
	if err != nil {
		http.Error(w, "failed to load config", http.StatusInternalServerError)
		return
	}
	_, tokenErr := loadToken()
	resp := ConfigResponse{Config: cfg, Connected: tokenErr == nil}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (a *App) PutConfig(w http.ResponseWriter, r *http.Request) {
	var cfg Config
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if err := saveConfig(cfg); err != nil {
		http.Error(w, "failed to save config: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) GetAuthURL(w http.ResponseWriter, _ *http.Request) {
	cfg, err := loadConfig()
	if err != nil || cfg.ClientID == "" || cfg.ClientSecret == "" {
		http.Error(w, "client credentials not configured", http.StatusBadRequest)
		return
	}
	oc := oauthConfig(cfg.ClientID, cfg.ClientSecret)
	url := oc.AuthCodeURL("state")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"url": url})
}

func (a *App) Callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}
	cfg, err := loadConfig()
	if err != nil || cfg.ClientID == "" {
		http.Error(w, "credentials not configured", http.StatusBadRequest)
		return
	}
	oc := oauthConfig(cfg.ClientID, cfg.ClientSecret)
	tok, err := oc.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "token exchange failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if err := saveToken(tok); err != nil {
		http.Error(w, "failed to save token: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Redirect back to the settings tab in the SPA.
	http.Redirect(w, r, "/?tab=google-drive", http.StatusFound)
}

func (a *App) Disconnect(w http.ResponseWriter, _ *http.Request) {
	if err := deleteToken(); err != nil {
		http.Error(w, "failed to disconnect: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) Import(w http.ResponseWriter, r *http.Request) {
	cfg, err := loadConfig()
	if err != nil {
		http.Error(w, "failed to load config", http.StatusInternalServerError)
		return
	}
	if cfg.SheetID == "" {
		http.Error(w, "sheet ID not configured", http.StatusBadRequest)
		return
	}
	svc := newDriveService(cfg, a.officials, a.clubs, a.athletes, a.bouts, a.cards, a.reports)
	result, err := svc.Import(r.Context())
	if err != nil {
		http.Error(w, "import failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (a *App) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	cfg, err := loadConfig()
	if err != nil {
		http.Error(w, "failed to load config", http.StatusInternalServerError)
		return
	}
	svc := newDriveService(cfg, a.officials, a.clubs, a.athletes, a.bouts, a.cards, a.reports)
	link, err := svc.CreateTemplate(r.Context())
	if err != nil {
		http.Error(w, "create template failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"link": link})
}

func (a *App) ExportCard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	cardId, err := strconv.ParseUint(vars["cardId"], 10, 64)
	if err != nil {
		http.Error(w, "invalid card id", http.StatusBadRequest)
		return
	}
	cfg, err := loadConfig()
	if err != nil {
		http.Error(w, "failed to load config", http.StatusInternalServerError)
		return
	}
	svc := newDriveService(cfg, a.officials, a.clubs, a.athletes, a.bouts, a.cards, a.reports)
	links, err := svc.ExportCard(r.Context(), uint(cardId))
	if err != nil {
		http.Error(w, "export failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"links": links})
}
