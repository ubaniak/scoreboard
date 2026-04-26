package dump

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"archive/zip"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/rbac"
)

// App provides /settings/export and /settings/import endpoints.
type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
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
	p, err := a.useCase.ExportData()
	if err != nil {
		http.Error(w, "failed to read data: "+err.Error(), http.StatusInternalServerError)
		return
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

	uploadsDir := a.useCase.UploadsDir()
	_ = filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(uploadsDir, path)
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

	if err := a.useCase.Restore(&p); err != nil {
		http.Error(w, "restore failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	uploadsDir := a.useCase.UploadsDir()
	for _, zf := range imageFiles {
		rel := strings.TrimPrefix(zf.Name, "uploads/")
		dest := filepath.Join(uploadsDir, filepath.FromSlash(rel))
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
