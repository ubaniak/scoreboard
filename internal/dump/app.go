package dump

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/rbac"
)

// App provides /settings/export and /settings/import endpoints.
type App struct {
	db         *gorm.DB
	uploadsDir string
}

func NewApp(db *gorm.DB, uploadsDir string) *App {
	return &App{db: db, uploadsDir: uploadsDir}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("settings.export", "/settings/export", "GET", a.Export, rbac.Admin)
	rb.AddRoute("settings.import", "/settings/import", "POST", a.Import, rbac.Admin)
}

// ── local GORM models that mirror the existing tables ────────────────────────

type dbClub struct {
	gorm.Model
	Name     string
	Location string
	ImageUrl string
}

func (dbClub) TableName() string { return "clubs" }

type dbAthlete struct {
	gorm.Model
	Name             string
	AgeCategory      string
	Nationality      string
	ClubID           *uint
	ProvinceName     string
	ProvinceImageUrl string
	NationName       string
	NationImageUrl   string
	ImageUrl         string
}

func (dbAthlete) TableName() string { return "athletes" }

type dbOfficial struct {
	gorm.Model
	CardID             uint
	Name               string
	Nationality        string
	Gender             string
	YearOfBirth        int
	RegistrationNumber string
	Province           string
	Nation             string
}

func (dbOfficial) TableName() string { return "officials" }

type dbCard struct {
	gorm.Model
	Name                    string
	Description             string
	Date                    string
	Status                  string
	NumberOfJudges          int
	ImageUrl                string
	ShowCardImage           bool
	ShowAthleteImages       bool
	ShowClubImages          bool
	ShowOfficialAffiliation string
	ShowAthleteAffiliation  string
}

func (dbCard) TableName() string { return "cards" }

type dbBout struct {
	gorm.Model
	CardID         uint
	BoutNumber     int
	WeightClass    int
	GloveSize      string
	RoundLength    float64
	AgeCategory    string
	Experience     string
	Status         string
	Gender         string
	Decision       string
	Winner         string
	NumberOfJudges int
	Referee        string
	BoutType       string
	RedAthleteID   *uint
	BlueAthleteID  *uint
}

func (dbBout) TableName() string { return "bouts" }

type dbRound struct {
	gorm.Model
	BoutID          uint
	RoundNumber     int
	RedEightCounts  int
	BlueEightCounts int
	Status          string
}

func (dbRound) TableName() string { return "rounds" }

type dbRoundFoul struct {
	gorm.Model
	BoutId      uint
	Corner      string
	Type        string
	RoundNumber int
	Foul        string
}

func (dbRoundFoul) TableName() string { return "round_fouls" }

// Score has no gorm.Model (no primary key) — matches the existing scores table.
type dbScore struct {
	CardId        uint
	BoutNumber    int
	RoundNumber   int
	JudgeRole     string
	JudgeName     string
	Red           int
	Blue          int
	Status        string
	OverallWinner string
}

func (dbScore) TableName() string { return "scores" }

// ── export payload ────────────────────────────────────────────────────────────

type exportPayload struct {
	Version    int           `json:"version"`
	ExportedAt time.Time     `json:"exportedAt"`
	Clubs      []dbClub      `json:"clubs"`
	Athletes   []dbAthlete   `json:"athletes"`
	Officials  []dbOfficial  `json:"officials"`
	Cards      []dbCard      `json:"cards"`
	Bouts      []dbBout      `json:"bouts"`
	Rounds     []dbRound     `json:"rounds"`
	RoundFouls []dbRoundFoul `json:"roundFouls"`
	Scores     []dbScore     `json:"scores"`
}

// Export streams a ZIP containing data.json and all uploaded images.
func (a *App) Export(w http.ResponseWriter, r *http.Request) {
	var p exportPayload
	p.Version = 1
	p.ExportedAt = time.Now()

	for _, q := range []func() error{
		func() error { return a.db.Find(&p.Clubs).Error },
		func() error { return a.db.Find(&p.Athletes).Error },
		func() error { return a.db.Find(&p.Officials).Error },
		func() error { return a.db.Find(&p.Cards).Error },
		func() error { return a.db.Find(&p.Bouts).Error },
		func() error { return a.db.Find(&p.Rounds).Error },
		func() error { return a.db.Find(&p.RoundFouls).Error },
		func() error { return a.db.Find(&p.Scores).Error },
	} {
		if err := q(); err != nil {
			http.Error(w, "failed to read data: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	jsonBytes, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		http.Error(w, "failed to serialize data", http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("scoreboard-export-%s.zip", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	zw := zip.NewWriter(w)
	defer zw.Close()

	fw, err := zw.Create("data.json")
	if err != nil {
		return
	}
	_, _ = fw.Write(jsonBytes)

	_ = filepath.Walk(a.uploadsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(a.uploadsDir, path)
		if err != nil {
			return nil
		}
		zf, err := zw.Create("uploads/" + filepath.ToSlash(rel))
		if err != nil {
			return nil
		}
		f, err := os.Open(path)
		if err != nil {
			return nil
		}
		defer f.Close()
		_, _ = io.Copy(zf, f)
		return nil
	})
}

// Import reads a ZIP and fully restores the database and uploads directory.
func (a *App) Import(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(200 << 20); err != nil {
		http.Error(w, "failed to parse form", http.StatusBadRequest)
		return
	}
	f, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing 'file' field", http.StatusBadRequest)
		return
	}
	defer f.Close()

	zipBytes, err := io.ReadAll(f)
	if err != nil {
		http.Error(w, "failed to read upload", http.StatusInternalServerError)
		return
	}

	zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
	if err != nil {
		http.Error(w, "invalid zip file", http.StatusBadRequest)
		return
	}

	var p exportPayload
	var imageFiles []*zip.File

	for _, zf := range zr.File {
		switch {
		case zf.Name == "data.json":
			rc, err := zf.Open()
			if err != nil {
				http.Error(w, "failed to open data.json", http.StatusInternalServerError)
				return
			}
			err = json.NewDecoder(rc).Decode(&p)
			rc.Close()
			if err != nil {
				http.Error(w, "invalid data.json: "+err.Error(), http.StatusBadRequest)
				return
			}
		case strings.HasPrefix(zf.Name, "uploads/") && !zf.FileInfo().IsDir():
			imageFiles = append(imageFiles, zf)
		}
	}

	if p.Version == 0 {
		http.Error(w, "data.json not found in zip", http.StatusBadRequest)
		return
	}

	if err := a.restore(&p); err != nil {
		http.Error(w, "restore failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, zf := range imageFiles {
		rel := strings.TrimPrefix(zf.Name, "uploads/")
		dest := filepath.Join(a.uploadsDir, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
			continue
		}
		rc, err := zf.Open()
		if err != nil {
			continue
		}
		out, err := os.Create(dest)
		if err != nil {
			rc.Close()
			continue
		}
		_, _ = io.Copy(out, rc)
		out.Close()
		rc.Close()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{}`))
}

// restore clears all tables and re-inserts from the payload inside a transaction.
func (a *App) restore(p *exportPayload) error {
	return a.db.Transaction(func(tx *gorm.DB) error {
		// Delete in reverse FK dependency order.
		for _, table := range []string{
			"scores", "round_fouls", "rounds", "bouts",
			"officials", "cards", "athletes", "clubs",
		} {
			if err := tx.Exec("DELETE FROM " + table).Error; err != nil {
				return fmt.Errorf("clear %s: %w", table, err)
			}
		}

		for i := range p.Clubs {
			if err := tx.Create(&p.Clubs[i]).Error; err != nil {
				return fmt.Errorf("insert club %d: %w", p.Clubs[i].ID, err)
			}
		}
		for i := range p.Athletes {
			if err := tx.Create(&p.Athletes[i]).Error; err != nil {
				return fmt.Errorf("insert athlete %d: %w", p.Athletes[i].ID, err)
			}
		}
		for i := range p.Officials {
			if err := tx.Create(&p.Officials[i]).Error; err != nil {
				return fmt.Errorf("insert official %d: %w", p.Officials[i].ID, err)
			}
		}
		for i := range p.Cards {
			if err := tx.Create(&p.Cards[i]).Error; err != nil {
				return fmt.Errorf("insert card %d: %w", p.Cards[i].ID, err)
			}
		}
		for i := range p.Bouts {
			if err := tx.Create(&p.Bouts[i]).Error; err != nil {
				return fmt.Errorf("insert bout %d: %w", p.Bouts[i].ID, err)
			}
		}
		for i := range p.Rounds {
			if err := tx.Create(&p.Rounds[i]).Error; err != nil {
				return fmt.Errorf("insert round %d: %w", p.Rounds[i].ID, err)
			}
		}
		for i := range p.RoundFouls {
			if err := tx.Create(&p.RoundFouls[i]).Error; err != nil {
				return fmt.Errorf("insert round_foul %d: %w", p.RoundFouls[i].ID, err)
			}
		}
		for i := range p.Scores {
			if err := tx.Create(&p.Scores[i]).Error; err != nil {
				return fmt.Errorf("insert score: %w", err)
			}
		}

		return nil
	})
}
