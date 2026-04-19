package datadir

import (
	"os"
	"path/filepath"
)

// Dir returns the path to ~/.scoreboard, creating it if it does not exist.
func Dir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".scoreboard")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return dir, nil
}

// DBPath returns the full path to the SQLite database file.
func DBPath() (string, error) {
	dir, err := Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "scoreboard.db"), nil
}

// UploadsDir returns the full path to the uploads directory, creating it if needed.
func UploadsDir() (string, error) {
	dir, err := Dir()
	if err != nil {
		return "", err
	}
	uploads := filepath.Join(dir, "uploads")
	if err := os.MkdirAll(uploads, 0755); err != nil {
		return "", err
	}
	return uploads, nil
}
