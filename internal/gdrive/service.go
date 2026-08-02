package gdrive

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"strconv"
	"strings"

	driveAPI "google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
	sheetsAPI "google.golang.org/api/sheets/v4"

	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	cardEntities "github.com/ubaniak/scoreboard/internal/cards/entities"
	reportsPackage "github.com/ubaniak/scoreboard/internal/reports"
)

// Narrow interfaces matching what cmd/main.go already wires.

type OfficialCreator interface {
	FindOrCreate(name, nationality string, yearOfBirth int, registrationNumber string) error
}

type ClubCreator interface {
	FindOrCreateByName(name string) (uint, error)
	FindOrCreateProvince(name string) (uint, error)
	FindOrCreateNation(name string) (uint, error)
}

type AthleteCreator interface {
	FindOrCreateByNameAndClub(name string, clubID *uint) (uint, error)
	FindOrCreateByNameClubProvince(name string, clubID, provinceID *uint) (uint, error)
	FindOrCreateFull(name, ageCategory, gender, experience string, clubID, provinceID, nationID *uint, weightClass *float64) (uint, error)
}

type BoutCreator interface {
	Create(cardId uint, bout *boutEntities.Bout) error
	CreateBulk(cardId uint, bouts []*boutEntities.Bout) error
	Update(cardId, id uint, bout *boutEntities.UpdateBout) error
	List(cardId uint) ([]*boutEntities.Bout, error)
	GetNumberOfJudges(cardId uint) (int, error)
}

type CardFinderCreator interface {
	FindOrCreateByName(name, date string) (uint, error)
	Get(id uint) (*cardEntities.Card, error)
}

type ReportBuilder interface {
	FullReport(cardId uint) (*reportsPackage.ReportData, error)
	PublicReport(cardId uint) (*reportsPackage.ReportData, error)
	JudgeConsistencyReport(cardId uint) (*reportsPackage.JudgeConsistencyData, error)
}

// ImportResult summarises what was upserted.
type ImportResult struct {
	Clubs     int `json:"clubs"`
	Provinces int `json:"provinces"`
	Nations   int `json:"nations"`
	Athletes  int `json:"athletes"`
	Officials int `json:"officials"`
	Bouts     int `json:"bouts"`
}

// ExportedFile describes a single file uploaded to Drive.
type ExportedFile struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

// reportArtifact is a single named file to render then upload.
type reportArtifact struct {
	name  string
	write func(io.Writer) error
}

// ExportCardResult describes a card export with folder and files.
type ExportCardResult struct {
	FolderName string         `json:"folderName"`
	FolderLink string         `json:"folderLink"`
	Files      []ExportedFile `json:"files"`
}

// driveService wraps calls to Google Sheets + Drive APIs.
type driveService struct {
	cfg        Config
	officials  OfficialCreator
	clubs      ClubCreator
	athletes   AthleteCreator
	bouts      BoutCreator
	cards      CardFinderCreator
	reports    ReportBuilder
}

func newDriveService(
	cfg Config,
	officials OfficialCreator,
	clubs ClubCreator,
	athletes AthleteCreator,
	bouts BoutCreator,
	cards CardFinderCreator,
	reports ReportBuilder,
) *driveService {
	return &driveService{
		cfg:       cfg,
		officials: officials,
		clubs:     clubs,
		athletes:  athletes,
		bouts:     bouts,
		cards:     cards,
		reports:   reports,
	}
}

func (s *driveService) sheetsService(ctx context.Context) (*sheetsAPI.Service, error) {
	tok, err := loadToken()
	if err != nil {
		return nil, fmt.Errorf("not connected: %w", err)
	}
	oc := oauthConfig(s.cfg.ClientID, s.cfg.ClientSecret)
	client := oc.Client(ctx, tok)
	return sheetsAPI.NewService(ctx, option.WithHTTPClient(client))
}

func (s *driveService) driveService(ctx context.Context) (*driveAPI.Service, error) {
	tok, err := loadToken()
	if err != nil {
		return nil, fmt.Errorf("not connected: %w", err)
	}
	oc := oauthConfig(s.cfg.ClientID, s.cfg.ClientSecret)
	client := oc.Client(ctx, tok)
	return driveAPI.NewService(ctx, option.WithHTTPClient(client))
}

// sheetRows returns rows (skipping header) for a named tab in a specific sheet.
func (s *driveService) sheetRows(ctx context.Context, sheetID, tab string) (header []string, rows [][]string, err error) {
	svc, err := s.sheetsService(ctx)
	if err != nil {
		return nil, nil, err
	}
	resp, err := svc.Spreadsheets.Values.Get(sheetID, tab).Context(ctx).Do()
	if err != nil {
		return nil, nil, fmt.Errorf("read sheet %q: %w", tab, err)
	}
	if len(resp.Values) == 0 {
		return nil, nil, nil
	}
	for _, v := range resp.Values[0] {
		header = append(header, fmt.Sprintf("%v", v))
	}
	for _, row := range resp.Values[1:] {
		var r []string
		for _, v := range row {
			r = append(r, fmt.Sprintf("%v", v))
		}
		rows = append(rows, r)
	}
	return header, rows, nil
}

func colIdx(header []string, name string) int {
	key := normalise(name)
	for i, h := range header {
		if normalise(h) == key {
			return i
		}
	}
	return -1
}

func normalise(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "_", "")
	return s
}

func cell(row []string, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}

// Import reads a single Google Sheet — one card per file — and upserts its
// officials and athlete matchups.
func (s *driveService) Import(ctx context.Context, sheetID string) (*ImportResult, error) {
	res := &ImportResult{}

	cardName, cardDate, err := s.readCardInfo(ctx, sheetID)
	if err != nil {
		return nil, fmt.Errorf("read card info: %w", err)
	}
	if cardName == "" {
		return nil, fmt.Errorf("Card Info sheet is missing a Card Name")
	}

	// ── Officials ────────────────────────────────────────────────────────────
	hdr, rows, err := s.sheetRows(ctx, sheetID, "Officials")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		natIdx := colIdx(hdr, "Nationality")
		yobIdx := colIdx(hdr, "Year of Birth")
		regIdx := colIdx(hdr, "Registration Number")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			nat := cell(row, natIdx)
			reg := cell(row, regIdx)
			yob := 0
			if v := cell(row, yobIdx); v != "" {
				yob, _ = strconv.Atoi(v)
			}
			if err := s.officials.FindOrCreate(name, nat, yob, reg); err == nil {
				res.Officials++
			}
		}
	}

	// ── Athletes (one row per fighter per bout — each row also carries that
	// fighter's full profile: weight, age category, gender, experience, and
	// affiliations) ──────────────────────────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Athletes")
	if err == nil && len(rows) > 0 {
		s.importAthleteMatchups(cardName, cardDate, hdr, rows, res)
	}

	return res, nil
}

// ImportAll imports data from all configured sheets.
func (s *driveService) ImportAll(ctx context.Context) (*ImportResult, error) {
	if len(s.cfg.Sheets) == 0 {
		return &ImportResult{}, fmt.Errorf("no sheets configured")
	}

	totalResult := &ImportResult{}
	for _, sheet := range s.cfg.Sheets {
		result, err := s.Import(ctx, sheet.ID)
		if err != nil {
			return nil, fmt.Errorf("import sheet %q: %w", sheet.ID, err)
		}
		totalResult.Clubs += result.Clubs
		totalResult.Provinces += result.Provinces
		totalResult.Nations += result.Nations
		totalResult.Athletes += result.Athletes
		totalResult.Officials += result.Officials
		totalResult.Bouts += result.Bouts
	}
	return totalResult, nil
}

// readCardInfo reads the Card Info sheet's Field/Value rows. The whole file
// describes exactly one card, so its name and date live here rather than
// being repeated on every matchup row.
func (s *driveService) readCardInfo(ctx context.Context, sheetID string) (name, date string, err error) {
	_, rows, err := s.sheetRows(ctx, sheetID, "Card Info")
	if err != nil {
		return "", "", err
	}
	for _, row := range rows {
		switch normalise(cell(row, 0)) {
		case "cardname":
			name = cell(row, 1)
		case "date":
			date = cell(row, 1)
		}
	}
	return name, date, nil
}

// importAthleteMatchups upserts every fighter in the Athletes sheet and
// pairs same-Bout-Number rows (Corner: red/blue) into bouts on the card.
func (s *driveService) importAthleteMatchups(cardName, cardDate string, hdr []string, rows [][]string, res *ImportResult) {
	boutNumIdx := colIdx(hdr, "Bout Number")
	cornerIdx := colIdx(hdr, "Corner")
	boutTypeIdx := colIdx(hdr, "Bout Type")
	roundLenIdx := colIdx(hdr, "Round Length")
	gloveSizeIdx := colIdx(hdr, "Glove Size")
	nameIdx := colIdx(hdr, "Name")
	weightIdx := colIdx(hdr, "Weight")
	ageCatIdx := colIdx(hdr, "Age Category")
	genderIdx := colIdx(hdr, "Gender")
	expIdx := colIdx(hdr, "Experience")
	clubIdx := colIdx(hdr, "Club")
	provinceIdx := colIdx(hdr, "Province")
	nationIdx := colIdx(hdr, "Nationality")

	bouts := map[int]*boutEntities.Bout{}
	var boutOrder []int

	for i, row := range rows {
		name := cell(row, nameIdx)
		if name == "" {
			continue
		}

		var clubID *uint
		if clubName := cell(row, clubIdx); clubName != "" {
			if id, err := s.clubs.FindOrCreateByName(clubName); err == nil {
				clubID = &id
				res.Clubs++
			}
		}
		var provinceID *uint
		if provinceName := cell(row, provinceIdx); provinceName != "" {
			if id, err := s.clubs.FindOrCreateProvince(provinceName); err == nil {
				provinceID = &id
				res.Provinces++
			}
		}
		var nationID *uint
		if nationName := cell(row, nationIdx); nationName != "" {
			if id, err := s.clubs.FindOrCreateNation(nationName); err == nil {
				nationID = &id
				res.Nations++
			}
		}
		var weightClass *float64
		if weightStr := cell(row, weightIdx); weightStr != "" {
			if w, err := strconv.ParseFloat(weightStr, 64); err == nil {
				weightClass = &w
			}
		}
		ageCategoryStr := strings.ToLower(cell(row, ageCatIdx))
		genderStr := strings.ToLower(cell(row, genderIdx))
		experienceStr := strings.ToLower(cell(row, expIdx))

		athleteID, err := s.athletes.FindOrCreateFull(name, ageCategoryStr, genderStr, experienceStr, clubID, provinceID, nationID, weightClass)
		if err != nil {
			continue
		}
		res.Athletes++

		boutNum := i + 1
		if v := cell(row, boutNumIdx); v != "" {
			if n, _ := strconv.Atoi(v); n > 0 {
				boutNum = n
			}
		}

		bout, seen := bouts[boutNum]
		if !seen {
			ageCategory := mapAgeCategory(ageCategoryStr)
			experience := boutEntities.Experience(experienceStr)
			roundLen := mapRoundLength(cell(row, roundLenIdx))
			if roundLen == 0 {
				roundLen = roundLengthDefault(ageCategory, experience)
			}
			gloveSize := mapGloveSize(cell(row, gloveSizeIdx))
			if gloveSize == "" {
				gloveSize = boutEntities.TenOz
			}
			boutType := boutEntities.BoutTypeScored
			if v := cell(row, boutTypeIdx); v != "" {
				if bt := boutEntities.BoutType(strings.ToLower(v)); bt.IsValid() {
					boutType = bt
				}
			}
			bout = &boutEntities.Bout{
				BoutNumber:  boutNum,
				AgeCategory: ageCategory,
				Experience:  experience,
				Gender:      boutEntities.Gender(genderStr),
				RoundLength: roundLen,
				GloveSize:   gloveSize,
				BoutType:    boutType,
				Status:      boutEntities.BoutStatusNotStarted,
			}
			bouts[boutNum] = bout
			boutOrder = append(boutOrder, boutNum)
		}

		if strings.ToLower(cell(row, cornerIdx)) == "blue" {
			bout.BlueAthleteID = &athleteID
		} else {
			bout.RedAthleteID = &athleteID
		}
	}

	if len(boutOrder) == 0 {
		return
	}

	cardID, err := s.cards.FindOrCreateByName(cardName, cardDate)
	if err != nil {
		return
	}
	if existing, err := s.cards.Get(cardID); err == nil && existing != nil &&
		existing.Status != cardEntities.CardStatusUpComing {
		// Card already in progress, completed, or cancelled. Skip to avoid
		// inserting duplicate bouts alongside the live ones.
		return
	}

	numJudges, _ := s.bouts.GetNumberOfJudges(cardID)
	existingByNumber := map[int]*boutEntities.Bout{}
	if existing, err := s.bouts.List(cardID); err == nil {
		for _, b := range existing {
			existingByNumber[b.BoutNumber] = b
		}
	}

	for _, num := range boutOrder {
		b := bouts[num]
		b.CardID = cardID
		if b.BoutType == boutEntities.BoutTypeScored {
			b.NumberOfJudges = numJudges
		}

		if prev, ok := existingByNumber[b.BoutNumber]; ok {
			upd := &boutEntities.UpdateBout{
				Gender:        &b.Gender,
				GloveSize:     &b.GloveSize,
				RoundLength:   &b.RoundLength,
				AgeCategory:   &b.AgeCategory,
				Experience:    &b.Experience,
				BoutType:      &b.BoutType,
				RedAthleteID:  &b.RedAthleteID,
				BlueAthleteID: &b.BlueAthleteID,
			}
			if b.NumberOfJudges != 0 {
				upd.NumberOfJudges = &b.NumberOfJudges
			}
			if err := s.bouts.Update(cardID, prev.ID, upd); err == nil {
				res.Bouts++
			}
			continue
		}
		if err := s.bouts.Create(cardID, b); err == nil {
			res.Bouts++
		}
	}
}

// ExportCard generates reports for a card, creates a folder, and uploads them to Drive.
func (s *driveService) ExportCard(ctx context.Context, cardId uint) (*ExportCardResult, error) {
	svc, err := s.driveService(ctx)
	if err != nil {
		return nil, err
	}

	fullRd, err := s.reports.FullReport(cardId)
	if err != nil {
		return nil, fmt.Errorf("build full report: %w", err)
	}

	// Create folder named after card
	folderName := sanitiseName(fullRd.CardName)
	folderID, folderLink, err := s.createFolder(ctx, svc, folderName, s.cfg.FolderID)
	if err != nil {
		return nil, fmt.Errorf("create folder: %w", err)
	}

	artifacts := []reportArtifact{
		{
			name:  fmt.Sprintf("full_report_%s_%s.csv", folderName, fullRd.CardDate),
			write: func(w io.Writer) error { return reportsPackage.WriteFullCSV(w, fullRd) },
		},
		{
			name:  fmt.Sprintf("full_report_%s_%s.pdf", folderName, fullRd.CardDate),
			write: func(w io.Writer) error { return reportsPackage.WriteFullPDF(w, fullRd) },
		},
	}

	if pubRd, err := s.reports.PublicReport(cardId); err == nil {
		pubName := sanitiseName(pubRd.CardName)
		artifacts = append(artifacts,
			reportArtifact{
				name:  fmt.Sprintf("public_report_%s_%s.csv", pubName, pubRd.CardDate),
				write: func(w io.Writer) error { return reportsPackage.WritePublicCSV(w, pubRd) },
			},
			reportArtifact{
				name:  fmt.Sprintf("public_report_%s_%s.pdf", pubName, pubRd.CardDate),
				write: func(w io.Writer) error { return reportsPackage.WritePublicPDF(w, pubRd) },
			},
		)
	}

	if consRd, err := s.reports.JudgeConsistencyReport(cardId); err == nil {
		consName := sanitiseName(consRd.CardName)
		artifacts = append(artifacts,
			reportArtifact{
				name:  fmt.Sprintf("judge_consistency_short_%s_%s.csv", consName, consRd.CardDate),
				write: func(w io.Writer) error { return reportsPackage.WriteShortConsistencyCSV(w, consRd) },
			},
			reportArtifact{
				name:  fmt.Sprintf("judge_consistency_short_%s_%s.pdf", consName, consRd.CardDate),
				write: func(w io.Writer) error { return reportsPackage.WriteShortConsistencyPDF(w, consRd) },
			},
			reportArtifact{
				name:  fmt.Sprintf("judge_consistency_full_%s_%s.csv", consName, consRd.CardDate),
				write: func(w io.Writer) error { return reportsPackage.WriteFullConsistencyCSV(w, consRd) },
			},
			reportArtifact{
				name:  fmt.Sprintf("judge_consistency_full_%s_%s.pdf", consName, consRd.CardDate),
				write: func(w io.Writer) error { return reportsPackage.WriteFullConsistencyPDF(w, consRd) },
			},
		)
	}

	return &ExportCardResult{
		FolderName: fullRd.CardName,
		FolderLink: folderLink,
		Files:      s.uploadArtifacts(ctx, svc, folderID, artifacts),
	}, nil
}

// uploadArtifacts renders and uploads each artifact, skipping any that fail
// to render or upload without aborting the rest.
func (s *driveService) uploadArtifacts(ctx context.Context, svc *driveAPI.Service, folderID string, artifacts []reportArtifact) []ExportedFile {
	files := make([]ExportedFile, 0, len(artifacts))
	for _, a := range artifacts {
		var buf bytes.Buffer
		if err := a.write(&buf); err != nil {
			continue
		}
		if link, err := s.upload(ctx, svc, a.name, &buf, folderID); err == nil {
			files = append(files, ExportedFile{Name: a.name, Link: link})
		}
	}
	return files
}

func (s *driveService) createFolder(ctx context.Context, svc *driveAPI.Service, folderName, parentID string) (string, string, error) {
	fm := &driveAPI.File{
		Name:     folderName,
		MimeType: "application/vnd.google-apps.folder",
	}
	if parentID != "" {
		fm.Parents = []string{parentID}
	}
	f, err := svc.Files.Create(fm).Context(ctx).Do()
	if err != nil {
		return "", "", err
	}
	link := fmt.Sprintf("https://drive.google.com/drive/folders/%s", f.Id)
	return f.Id, link, nil
}

func (s *driveService) upload(ctx context.Context, svc *driveAPI.Service, name string, data *bytes.Buffer, parentFolderID string) (string, error) {
	fm := &driveAPI.File{Name: name}
	if parentFolderID != "" {
		fm.Parents = []string{parentFolderID}
	}
	f, err := svc.Files.Create(fm).Media(data).Context(ctx).Do()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("https://drive.google.com/file/d/%s/view", f.Id), nil
}

// CreateTemplate creates a new Google Spreadsheet in Drive pre-filled with
// headers and sample rows for one card's three import tabs.
func (s *driveService) CreateTemplate(ctx context.Context) (string, error) {
	tok, err := loadToken()
	if err != nil {
		return "", fmt.Errorf("not connected: %w", err)
	}
	oc := oauthConfig(s.cfg.ClientID, s.cfg.ClientSecret)
	client := oc.Client(ctx, tok)
	sheetsSvc, err := sheetsAPI.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return "", err
	}

	spreadsheet := &sheetsAPI.Spreadsheet{
		Properties: &sheetsAPI.SpreadsheetProperties{
			Title: "Scoreboard Import Template",
		},
		Sheets: []*sheetsAPI.Sheet{
			{Properties: &sheetsAPI.SheetProperties{Title: "Card Info"}},
			{Properties: &sheetsAPI.SheetProperties{Title: "Officials"}},
			{Properties: &sheetsAPI.SheetProperties{Title: "Athletes"}},
		},
	}

	created, err := sheetsSvc.Spreadsheets.Create(spreadsheet).Context(ctx).Do()
	if err != nil {
		return "", fmt.Errorf("create spreadsheet: %w", err)
	}
	id := created.SpreadsheetId

	type tabData struct {
		name string
		rows [][]any
	}

	tabs := []tabData{
		{
			name: "Card Info",
			rows: [][]any{
				{"Field", "Value"},
				{"Card Name", "Test Card"},
				{"Date", "2026-05-01"},
			},
		},
		{
			name: "Officials",
			rows: [][]any{
				{"Name", "Nationality", "Year of Birth", "Registration Number"},
				{"Ref Roberts", "NZL", 1980, "REF001"},
			},
		},
		{
			name: "Athletes",
			rows: [][]any{
				{
					"Bout Number", "Corner", "Bout Type", "Round Length", "Glove Size",
					"Name", "Weight", "Age Category", "Gender", "Experience",
					"Club", "Province", "Nationality",
				},
				{1, "red", "scored", "3", "10oz", "Jane Smith", 60, "elite", "female", "open", "City Boxing", "Auckland", "NZL"},
				{1, "blue", "scored", "3", "10oz", "Amelia Clarke", 64, "elite", "female", "open", "North Stars", "Wellington", "NZL"},
				{2, "red", "scored", "3", "10oz", "Mark Jones", 75, "elite", "male", "open", "City Boxing", "Auckland", "NZL"},
				{2, "blue", "scored", "3", "10oz", "Liam Turner", 81, "elite", "male", "open", "North Stars", "Wellington", "NZL"},
			},
		},
	}

	for _, tab := range tabs {
		vr := &sheetsAPI.ValueRange{Values: tab.rows}
		_, err := sheetsSvc.Spreadsheets.Values.
			Update(id, tab.name+"!A1", vr).
			ValueInputOption("RAW").
			Context(ctx).
			Do()
		if err != nil {
			return "", fmt.Errorf("populate %s tab: %w", tab.name, err)
		}
	}

	return fmt.Sprintf("https://docs.google.com/spreadsheets/d/%s/edit", id), nil
}

func sanitiseName(s string) string {
	r := strings.NewReplacer(" ", "_", "/", "-", "\\", "-")
	return r.Replace(s)
}

func mapAgeCategory(s string) boutEntities.AgeCategory {
	switch strings.ToLower(s) {
	case "u13":
		return boutEntities.JuniorA
	case "u15":
		return boutEntities.JuniorB
	case "u17":
		return boutEntities.JuniorC
	case "u19":
		return boutEntities.Youth
	case "elite":
		return boutEntities.Elite
	case "masters":
		return boutEntities.Masters
	default:
		return boutEntities.AgeCategory(strings.ToLower(s))
	}
}

func mapRoundLength(s string) boutEntities.RoundLength {
	clean := strings.TrimSpace(strings.ToLower(strings.ReplaceAll(s, "min", "")))
	switch clean {
	case "1", "1.0":
		return boutEntities.OneMinute
	case "1.5":
		return boutEntities.OneHalfMinute
	case "2", "2.0":
		return boutEntities.TwoMinutes
	case "3", "3.0":
		return boutEntities.ThreeMinutes
	}
	return 0
}

func mapGloveSize(s string) boutEntities.GloveSize {
	clean := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(s, " ", ""), "oz", ""))
	switch clean {
	case "10":
		return boutEntities.TenOz
	case "12":
		return boutEntities.TwelveOz
	case "16":
		return boutEntities.SixteenOz
	}
	return boutEntities.GloveSize(strings.ToLower(strings.ReplaceAll(s, " ", "")))
}

func roundLengthDefault(age boutEntities.AgeCategory, exp boutEntities.Experience) boutEntities.RoundLength {
	if age == boutEntities.JuniorA {
		return boutEntities.OneMinute
	}
	if age == boutEntities.JuniorB || age == boutEntities.Masters {
		return boutEntities.OneHalfMinute
	}
	if exp == boutEntities.Open {
		return boutEntities.ThreeMinutes
	}
	return boutEntities.TwoMinutes
}
