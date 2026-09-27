package datadir

import (
	"os"
	"path/filepath"
)

// baseDirOverride, when set via SetBaseDir, is used in place of
// ~/.scoreboard. Platforms with no conventional home directory (iOS,
// Android) have no other way to point this package at their sandboxed
// storage location.
var baseDirOverride string

// SetBaseDir overrides where Dir looks for the scoreboard data directory.
// Call once at startup before any other function in this package is used.
func SetBaseDir(path string) {
	baseDirOverride = path
}

// Dir returns the path to the scoreboard data directory (~/.scoreboard
// unless overridden via SetBaseDir), creating it if it does not exist.
func Dir() (string, error) {
	dir := baseDirOverride
	if dir == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		dir = filepath.Join(home, ".scoreboard")
	}
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
