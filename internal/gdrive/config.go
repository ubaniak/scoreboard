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

// Sheet maps a card name to a Google Sheet ID.
type Sheet struct {
	CardName string `json:"cardName"`
	SheetID  string `json:"sheetId"`
}

// Config is persisted to ~/.scoreboard/gdrive_config.json.
type Config struct {
	ClientID     string   `json:"clientId"`
	ClientSecret string   `json:"clientSecret"`
	Sheets       []Sheet  `json:"sheets"`
	FolderID     string   `json:"folderId"`
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
		return Config{}, err
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
