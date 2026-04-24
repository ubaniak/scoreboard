package backup

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/ubaniak/scoreboard/internal/datadir"
)

// Config is persisted to ~/.scoreboard/backup_config.json.
type Config struct {
	Enabled   bool   `json:"enabled"`
	BackupDir string `json:"backupDir"`
}

// BackupEntry describes a single backup file.
type BackupEntry struct {
	Filename  string    `json:"filename"`
	CreatedAt time.Time `json:"createdAt"`
}

type service struct {
	dbPath     string
	configPath string
	cfg        Config
}

func newService(dbPath string) (*service, error) {
	dir, err := datadir.Dir()
	if err != nil {
		return nil, err
	}
	svc := &service{
		dbPath:     dbPath,
		configPath: filepath.Join(dir, "backup_config.json"),
		cfg: Config{
			Enabled:   false,
			BackupDir: filepath.Join(dir, "backup"),
		},
	}
	_ = svc.loadConfig()
	return svc, nil
}

func (s *service) loadConfig() error {
	data, err := os.ReadFile(s.configPath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &s.cfg)
}

func (s *service) saveConfig() error {
	data, err := json.MarshalIndent(s.cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath, data, 0644)
}

func (s *service) createBackup() error {
	if err := os.MkdirAll(s.cfg.BackupDir, 0755); err != nil {
		return fmt.Errorf("create backup dir: %w", err)
	}
	ts := time.Now().Format("2006-01-02-15-04-05")
	filename := ts + "-scoreboardDB.zip"
	dest := filepath.Join(s.cfg.BackupDir, filename)

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	zw := zip.NewWriter(out)
	defer zw.Close()

	// Add database.
	if err := addFileToZip(zw, s.dbPath, "scoreboard.db"); err != nil {
		return err
	}

	// Add uploads directory (images).
	uploadsDir, err := datadir.UploadsDir()
	if err == nil {
		_ = filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}
			rel, err := filepath.Rel(uploadsDir, path)
			if err != nil {
				return nil
			}
			return addFileToZip(zw, path, filepath.Join("uploads", rel))
		})
	}

	return nil
}

func addFileToZip(zw *zip.Writer, srcPath, entryName string) error {
	f, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer f.Close()
	fw, err := zw.Create(entryName)
	if err != nil {
		return err
	}
	_, err = io.Copy(fw, f)
	return err
}

func (s *service) deleteBackup(filename string) error {
	if strings.Contains(filename, "/") || strings.Contains(filename, "..") || !strings.HasSuffix(filename, "-scoreboardDB.zip") {
		return fmt.Errorf("invalid backup filename")
	}
	return os.Remove(filepath.Join(s.cfg.BackupDir, filename))
}

func (s *service) listBackups() ([]BackupEntry, error) {
	if err := os.MkdirAll(s.cfg.BackupDir, 0755); err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(s.cfg.BackupDir)
	if err != nil {
		return nil, err
	}
	var out []BackupEntry
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), "-scoreboardDB.zip") {
			continue
		}
		tsStr := strings.TrimSuffix(e.Name(), "-scoreboardDB.zip")
		ts, err := time.ParseInLocation("2006-01-02-15-04-05", tsStr, time.Local)
		if err != nil {
			continue
		}
		out = append(out, BackupEntry{Filename: e.Name(), CreatedAt: ts})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out, nil
}

func (s *service) restoreBackup(filename string) error {
	if strings.Contains(filename, "/") || strings.Contains(filename, "..") || !strings.HasSuffix(filename, "-scoreboardDB.zip") {
		return fmt.Errorf("invalid backup filename")
	}
	src := filepath.Join(s.cfg.BackupDir, filename)
	zr, err := zip.OpenReader(src)
	if err != nil {
		return fmt.Errorf("open backup: %w", err)
	}
	defer zr.Close()

	uploadsDir, err := datadir.UploadsDir()
	if err != nil {
		return fmt.Errorf("get uploads dir: %w", err)
	}

	dbRestored := false
	for _, zf := range zr.File {
		if zf.FileInfo().IsDir() {
			continue
		}
		// Reject any path traversal inside the zip.
		if strings.Contains(zf.Name, "..") {
			continue
		}

		if zf.Name == "scoreboard.db" {
			if err := extractZipEntry(zf, s.dbPath); err != nil {
				return fmt.Errorf("restore db: %w", err)
			}
			dbRestored = true
			continue
		}

		if strings.HasPrefix(zf.Name, "uploads/") {
			rel := strings.TrimPrefix(zf.Name, "uploads/")
			dest := filepath.Join(uploadsDir, rel)
			if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
				return fmt.Errorf("create upload dir: %w", err)
			}
			if err := extractZipEntry(zf, dest); err != nil {
				return fmt.Errorf("restore upload %s: %w", rel, err)
			}
		}
	}

	if !dbRestored {
		return fmt.Errorf("scoreboard.db not found in backup archive")
	}
	return nil
}

func extractZipEntry(zf *zip.File, dest string) error {
	rc, err := zf.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	tmp := dest + ".restore_tmp"
	out, err := os.Create(tmp)
	if err != nil {
		return err
	}
	if _, err = io.Copy(out, rc); err != nil {
		out.Close()
		os.Remove(tmp)
		return err
	}
	out.Close()
	return os.Rename(tmp, dest)
}
