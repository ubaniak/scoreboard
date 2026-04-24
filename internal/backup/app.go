package backup

import (
	"encoding/json"
	"net/http"

	"github.com/ubaniak/scoreboard/internal/rbac"
)

// App exposes backup endpoints and a hook for bout-start auto-backup.
type App struct {
	svc *service
}

func NewApp(dbPath string) (*App, error) {
	svc, err := newService(dbPath)
	if err != nil {
		return nil, err
	}
	return &App{svc: svc}, nil
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("backup")
	sr.AddRoute("backup.config.get", "/config", http.MethodGet, a.GetConfig, rbac.Admin)
	sr.AddRoute("backup.config.put", "/config", http.MethodPut, a.PutConfig, rbac.Admin)
	sr.AddRoute("backup.list", "/list", http.MethodGet, a.List, rbac.Admin)
	sr.AddRoute("backup.now", "/now", http.MethodPost, a.BackupNow, rbac.Admin)
	sr.AddRoute("backup.restore", "/restore", http.MethodPost, a.Restore, rbac.Admin)
	sr.AddRoute("backup.delete", "/delete", http.MethodPost, a.Delete, rbac.Admin)
}

// TriggerIfEnabled is called by the bouts hook when a bout starts.
func (a *App) TriggerIfEnabled() {
	if a.svc.cfg.Enabled {
		_ = a.svc.createBackup()
	}
}

func (a *App) GetConfig(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(a.svc.cfg)
}

func (a *App) PutConfig(w http.ResponseWriter, r *http.Request) {
	var cfg Config
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	a.svc.cfg = cfg
	if err := a.svc.saveConfig(); err != nil {
		http.Error(w, "failed to save config: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) List(w http.ResponseWriter, _ *http.Request) {
	backups, err := a.svc.listBackups()
	if err != nil {
		http.Error(w, "failed to list backups: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if backups == nil {
		backups = []BackupEntry{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(backups)
}

func (a *App) BackupNow(w http.ResponseWriter, _ *http.Request) {
	if err := a.svc.createBackup(); err != nil {
		http.Error(w, "backup failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) Delete(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Filename string `json:"filename"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Filename == "" {
		http.Error(w, "missing filename", http.StatusBadRequest)
		return
	}
	if err := a.svc.deleteBackup(body.Filename); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) Restore(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Filename string `json:"filename"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Filename == "" {
		http.Error(w, "missing filename", http.StatusBadRequest)
		return
	}
	if err := a.svc.restoreBackup(body.Filename); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
