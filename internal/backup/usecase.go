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

type UseCase interface {
	IsEnabled() bool
	GetConfig() Config
	SaveConfig(cfg Config) error
	ListBackups() ([]BackupEntry, error)
	CreateBackup() error
	BackupFilePath(filename string) (string, error)
	DeleteBackup(filename string) error
	RestoreBackup(filename string) error
}

type useCase struct {
	dbPath     string
	configPath string
	cfg        Config
}

func NewUseCase(dbPath string) (UseCase, error) {
	dir, err := datadir.Dir()
	if err != nil {
		return nil, err
	}
	uc := &useCase{
		dbPath:     dbPath,
		configPath: filepath.Join(dir, "backup_config.json"),
		cfg: Config{
			Enabled:   false,
			BackupDir: filepath.Join(dir, "backup"),
		},
	}
	_ = uc.loadConfig()
	return uc, nil
}

func (uc *useCase) IsEnabled() bool { return uc.cfg.Enabled }

func (uc *useCase) GetConfig() Config { return uc.cfg }

func (uc *useCase) SaveConfig(cfg Config) error {
	uc.cfg = cfg
	data, err := json.MarshalIndent(uc.cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(uc.configPath, data, 0644)
}

func (uc *useCase) loadConfig() error {
	data, err := os.ReadFile(uc.configPath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &uc.cfg)
}

func (uc *useCase) CreateBackup() error {
	if err := os.MkdirAll(uc.cfg.BackupDir, 0755); err != nil {
		return fmt.Errorf("create backup dir: %w", err)
	}
	ts := time.Now().Format("2006-01-02-15-04-05")
	filename := ts + "-scoreboardDB.zip"
	dest := filepath.Join(uc.cfg.BackupDir, filename)

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	zw := zip.NewWriter(out)
	defer zw.Close()

	if err := addFileToZip(zw, uc.dbPath, "scoreboard.db"); err != nil {
		return err
	}

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

	if err := zw.Close(); err != nil {
		return err
	}
	if err := out.Close(); err != nil {
		return err
	}

	uc.pruneOldBackups(maxBackups)
	return nil
}

const maxBackups = 4

func (uc *useCase) pruneOldBackups(keep int) {
	entries, err := uc.ListBackups()
	if err != nil {
		return
	}
	for i := keep; i < len(entries); i++ {
		_ = os.Remove(filepath.Join(uc.cfg.BackupDir, entries[i].Filename))
	}
}

func (uc *useCase) BackupFilePath(filename string) (string, error) {
	if strings.Contains(filename, "/") || strings.Contains(filename, "..") || !strings.HasSuffix(filename, "-scoreboardDB.zip") {
		return "", fmt.Errorf("invalid backup filename")
	}
	return filepath.Join(uc.cfg.BackupDir, filename), nil
}

func (uc *useCase) DeleteBackup(filename string) error {
	if strings.Contains(filename, "/") || strings.Contains(filename, "..") || !strings.HasSuffix(filename, "-scoreboardDB.zip") {
		return fmt.Errorf("invalid backup filename")
	}
	return os.Remove(filepath.Join(uc.cfg.BackupDir, filename))
}

func (uc *useCase) ListBackups() ([]BackupEntry, error) {
	if err := os.MkdirAll(uc.cfg.BackupDir, 0755); err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(uc.cfg.BackupDir)
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

func (uc *useCase) RestoreBackup(filename string) error {
	if strings.Contains(filename, "/") || strings.Contains(filename, "..") || !strings.HasSuffix(filename, "-scoreboardDB.zip") {
		return fmt.Errorf("invalid backup filename")
	}
	src := filepath.Join(uc.cfg.BackupDir, filename)
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
		if strings.Contains(zf.Name, "..") {
			continue
		}

		if zf.Name == "scoreboard.db" {
			if err := extractZipEntry(zf, uc.dbPath); err != nil {
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
