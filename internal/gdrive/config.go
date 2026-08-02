package gdrive

import (
	"encoding/json"
	"os"
	"path/filepath"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	driveAPI "google.golang.org/api/drive/v3"
	sheetsAPI "google.golang.org/api/sheets/v4"

	"github.com/ubaniak/scoreboard/internal/datadir"
)

// SheetEntry maps a display Name onto a Google Sheet ID — one card per
// file, so the sheet's own "Card Info" tab (not this config) is the source
// of truth for which card it belongs to. Name is purely for the admin's
// own reference when picking a sheet to import.
type SheetEntry struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Config is persisted to ~/.scoreboard/gdrive_config.json.
type Config struct {
	ClientID     string       `json:"clientId"`
	ClientSecret string       `json:"clientSecret"`
	Sheets       []SheetEntry `json:"sheets"`
	FolderID     string       `json:"folderId"`
}

// ConfigResponse is what the frontend receives — includes connected state.
type ConfigResponse struct {
	Config
	Connected bool `json:"connected"`
}

func configPath() (string, error) {
	dir, err := datadir.Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "gdrive_config.json"), nil
}

func tokenPath() (string, error) {
	dir, err := datadir.Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "gdrive_token.json"), nil
}

func loadConfig() (Config, error) {
	p, err := configPath()
	if err != nil {
		return Config{}, err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return Config{}, nil
		}
		return Config{}, err
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		// Older configs stored Sheets as a plain []string. Fall back to that
		// shape so existing users don't lose their sheet mappings on upgrade.
		var legacy struct {
			ClientID     string   `json:"clientId"`
			ClientSecret string   `json:"clientSecret"`
			Sheets       []string `json:"sheets"`
			FolderID     string   `json:"folderId"`
		}
		if legacyErr := json.Unmarshal(data, &legacy); legacyErr != nil {
			return Config{}, err
		}
		cfg = Config{ClientID: legacy.ClientID, ClientSecret: legacy.ClientSecret, FolderID: legacy.FolderID}
		for _, id := range legacy.Sheets {
			cfg.Sheets = append(cfg.Sheets, SheetEntry{ID: id, Name: id})
		}
	}
	return cfg, nil
}

func saveConfig(cfg Config) error {
	p, err := configPath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0644)
}

func loadToken() (*oauth2.Token, error) {
	p, err := tokenPath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	var tok oauth2.Token
	if err := json.Unmarshal(data, &tok); err != nil {
		return nil, err
	}
	return &tok, nil
}

func saveToken(tok *oauth2.Token) error {
	p, err := tokenPath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(tok, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0600)
}

func deleteToken() error {
	p, err := tokenPath()
	if err != nil {
		return err
	}
	err = os.Remove(p)
	if os.IsNotExist(err) {
		return nil
	}
	return err
}

func oauthConfig(clientID, clientSecret string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://localhost:8080/api/gdrive/callback",
		Scopes: []string{
			sheetsAPI.SpreadsheetsReadonlyScope,
			driveAPI.DriveFileScope,
		},
		Endpoint: google.Endpoint,
	}
}
