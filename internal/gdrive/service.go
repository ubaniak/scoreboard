package gdrive

import (
	"bytes"
	"context"
	"fmt"
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

// AthleteInfo carries the minimal athlete fields needed at gdrive import time.
type AthleteInfo struct {
	ID          uint
	AgeCategory string
	Experience  string
	Gender      string
}

type AthleteCreator interface {
	FindOrCreateByNameAndClub(name string, clubID *uint) (uint, error)
	FindOrCreateByNameClubProvince(name string, clubID, provinceID *uint) (uint, error)
	UpsertFull(name, gender, ageCategory, experience string, clubID, provinceID, nationID *uint) (uint, error)
	FindFirstByName(name string) (*AthleteInfo, error)
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

// Import reads a single Google Sheet and upserts all entities.
func (s *driveService) Import(ctx context.Context, sheetID string) (*ImportResult, error) {
	res := &ImportResult{}

	// ── Athletes ─────────────────────────────────────────────────────────────
	// Columns: Name, Gender, Age Category, Experience, Club, Province, Nationality.
	// Club/Province/Nationality are names — affiliations created on demand.
	hdr, rows, err := s.sheetRows(ctx, sheetID, "Athletes")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		genderIdx := colIdx(hdr, "Gender")
		ageIdx := colIdx(hdr, "Age Category")
		expIdx := colIdx(hdr, "Experience")
		clubIdx := colIdx(hdr, "Club")
		provinceIdx := colIdx(hdr, "Province")
		nationIdx := colIdx(hdr, "Nationality")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			var clubID, provinceID, nationID *uint
			if v := cell(row, clubIdx); v != "" {
				if id, err := s.clubs.FindOrCreateByName(v); err == nil {
					clubID = &id
					res.Clubs++
				}
			}
			if v := cell(row, provinceIdx); v != "" {
				if id, err := s.clubs.FindOrCreateProvince(v); err == nil {
					provinceID = &id
					res.Provinces++
				}
			}
			if v := cell(row, nationIdx); v != "" {
				if id, err := s.clubs.FindOrCreateNation(v); err == nil {
					nationID = &id
					res.Nations++
				}
			}
			gender := strings.ToLower(cell(row, genderIdx))
			ageCategory := strings.ToLower(cell(row, ageIdx))
			experience := strings.ToLower(cell(row, expIdx))
			if _, err := s.athletes.UpsertFull(name, gender, ageCategory, experience, clubID, provinceID, nationID); err == nil {
				res.Athletes++
			}
		}
	}

	// ── Officials ────────────────────────────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Officials")
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

	// ── Cards (bouts) ────────────────────────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Cards")
	if err == nil && len(rows) > 0 {
		res.Bouts += s.importBouts(ctx, hdr, rows)
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
		result, err := s.Import(ctx, sheet.SheetID)
		if err != nil {
			return nil, fmt.Errorf("import sheet %q (%s): %w", sheet.CardName, sheet.SheetID, err)
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

func (s *driveService) importBouts(_ context.Context, hdr []string, rows [][]string) int {
	cardNameIdx := colIdx(hdr, "Card Name")
	dateIdx := colIdx(hdr, "Date")
	boutNumIdx := colIdx(hdr, "Bout Number")
	boutTypeIdx := colIdx(hdr, "Bout Type")
	redAthleteIdx := colIdx(hdr, "Red Athlete")
	blueAthleteIdx := colIdx(hdr, "Blue Athlete")
	roundLenIdx := colIdx(hdr, "Round Length")
	gloveSizeIdx := colIdx(hdr, "Glove Size")

	// Group rows by card name.
	type cardKey struct{ name, date string }
	cardBouts := map[cardKey][]*boutEntities.Bout{}
	var cardOrder []cardKey

	for i, row := range rows {
		cardName := cell(row, cardNameIdx)
		if cardName == "" {
			continue
		}
		date := cell(row, dateIdx)
		key := cardKey{cardName, date}
		if _, seen := cardBouts[key]; !seen {
			cardOrder = append(cardOrder, key)
		}

		boutNum := i + 1
		if v := cell(row, boutNumIdx); v != "" {
			if n, _ := strconv.Atoi(v); n > 0 {
				boutNum = n
			}
		}

		redName := cell(row, redAthleteIdx)
		if redName == "" {
			continue
		}
		red, err := s.athletes.FindFirstByName(redName)
		if err != nil || red == nil {
			continue
		}
		ageCategory := boutEntities.AgeCategory(strings.ToLower(red.AgeCategory))
		experience := boutEntities.Experience(strings.ToLower(red.Experience))
		gender := boutEntities.Gender(strings.ToLower(red.Gender))

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

		bout := &boutEntities.Bout{
			BoutNumber:   boutNum,
			AgeCategory:  ageCategory,
			Experience:   experience,
			Gender:       gender,
			RoundLength:  roundLen,
			GloveSize:    gloveSize,
			BoutType:     boutType,
			Status:       boutEntities.BoutStatusNotStarted,
			RedAthleteID: &red.ID,
		}

		if blueName := cell(row, blueAthleteIdx); blueName != "" {
			if blue, err := s.athletes.FindFirstByName(blueName); err == nil && blue != nil {
				bout.BlueAthleteID = &blue.ID
			}
		}

		cardBouts[key] = append(cardBouts[key], bout)
	}

	imported := 0
	for _, key := range cardOrder {
		bouts := cardBouts[key]
		cardID, err := s.cards.FindOrCreateByName(key.name, key.date)
		if err != nil {
			continue
		}
		if existing, err := s.cards.Get(cardID); err == nil && existing != nil &&
			existing.Status != cardEntities.CardStatusUpComing {
			// Card already in progress, completed, or cancelled. Skip to avoid
			// inserting duplicate bouts alongside the live ones.
			continue
		}
		if numJudges, err := s.bouts.GetNumberOfJudges(cardID); err == nil {
			for _, b := range bouts {
				if b.BoutType == boutEntities.BoutTypeScored {
					b.NumberOfJudges = numJudges
				}
			}
		}
		for _, b := range bouts {
			b.CardID = cardID
		}

		existingByNumber := map[int]*boutEntities.Bout{}
		if existing, err := s.bouts.List(cardID); err == nil {
			for _, b := range existing {
				existingByNumber[b.BoutNumber] = b
			}
		}

		for _, b := range bouts {
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
					imported++
				}
				continue
			}
			if err := s.bouts.Create(cardID, b); err == nil {
				imported++
			}
		}
	}
	return imported
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

	result := &ExportCardResult{
		FolderName: fullRd.CardName,
		FolderLink: folderLink,
		Files:      []ExportedFile{},
	}

	// Full Report CSV
	var fullBuf bytes.Buffer
	if err := reportsPackage.WriteFullCSV(&fullBuf, fullRd); err == nil {
		fullName := fmt.Sprintf("full_report_%s_%s.csv", sanitiseName(fullRd.CardName), fullRd.CardDate)
		if link, err := s.upload(ctx, svc, fullName, &fullBuf, folderID); err == nil {
			result.Files = append(result.Files, ExportedFile{Name: fullName, Link: link})
		}
	}

	// Full Report PDF
	var fullPdfBuf bytes.Buffer
	if err := reportsPackage.WriteFullPDF(&fullPdfBuf, fullRd); err == nil {
		fullPdfName := fmt.Sprintf("full_report_%s_%s.pdf", sanitiseName(fullRd.CardName), fullRd.CardDate)
		if link, err := s.upload(ctx, svc, fullPdfName, &fullPdfBuf, folderID); err == nil {
			result.Files = append(result.Files, ExportedFile{Name: fullPdfName, Link: link})
		}
	}

	// Public Report CSV
	pubRd, err := s.reports.PublicReport(cardId)
	if err == nil {
		var pubBuf bytes.Buffer
		if err := reportsPackage.WritePublicCSV(&pubBuf, pubRd); err == nil {
			pubName := fmt.Sprintf("public_report_%s_%s.csv", sanitiseName(pubRd.CardName), pubRd.CardDate)
			if link, err := s.upload(ctx, svc, pubName, &pubBuf, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: pubName, Link: link})
			}
		}

		// Public Report PDF
		var pubPdfBuf bytes.Buffer
		if err := reportsPackage.WritePublicPDF(&pubPdfBuf, pubRd); err == nil {
			pubPdfName := fmt.Sprintf("public_report_%s_%s.pdf", sanitiseName(pubRd.CardName), pubRd.CardDate)
			if link, err := s.upload(ctx, svc, pubPdfName, &pubPdfBuf, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: pubPdfName, Link: link})
			}
		}
	}

	// Judge Consistency reports
	if consRd, err := s.reports.JudgeConsistencyReport(cardId); err == nil {
		var shortCsv bytes.Buffer
		if err := reportsPackage.WriteShortConsistencyCSV(&shortCsv, consRd); err == nil {
			name := fmt.Sprintf("judge_consistency_short_%s_%s.csv", sanitiseName(consRd.CardName), consRd.CardDate)
			if link, err := s.upload(ctx, svc, name, &shortCsv, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: name, Link: link})
			}
		}
		var shortPdf bytes.Buffer
		if err := reportsPackage.WriteShortConsistencyPDF(&shortPdf, consRd); err == nil {
			name := fmt.Sprintf("judge_consistency_short_%s_%s.pdf", sanitiseName(consRd.CardName), consRd.CardDate)
			if link, err := s.upload(ctx, svc, name, &shortPdf, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: name, Link: link})
			}
		}
		var fullCsv bytes.Buffer
		if err := reportsPackage.WriteFullConsistencyCSV(&fullCsv, consRd); err == nil {
			name := fmt.Sprintf("judge_consistency_full_%s_%s.csv", sanitiseName(consRd.CardName), consRd.CardDate)
			if link, err := s.upload(ctx, svc, name, &fullCsv, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: name, Link: link})
			}
		}
		var fullPdf bytes.Buffer
		if err := reportsPackage.WriteFullConsistencyPDF(&fullPdf, consRd); err == nil {
			name := fmt.Sprintf("judge_consistency_full_%s_%s.pdf", sanitiseName(consRd.CardName), consRd.CardDate)
			if link, err := s.upload(ctx, svc, name, &fullPdf, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: name, Link: link})
			}
		}
	}

	return result, nil
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
// headers and sample rows for all four import tabs.
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
			{Properties: &sheetsAPI.SheetProperties{Title: "Athletes"}},
			{Properties: &sheetsAPI.SheetProperties{Title: "Officials"}},
			{Properties: &sheetsAPI.SheetProperties{Title: "Cards"}},
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
			name: "Athletes",
			rows: [][]any{
				{"Name", "Gender", "Age Category", "Experience", "Club", "Province", "Nationality"},
				{"Jane Smith", "Female", "Elite", "Open", "City Boxing", "Auckland", "New Zealand"},
				{"Mark Jones", "Male", "U19", "Novice", "North Stars", "Wellington", "New Zealand"},
			},
		},
		{
			name: "Officials",
			rows: [][]any{
				{"Name", "Nationality", "Year of Birth", "Registration Number"},
				{"Ref Roberts", "New Zealand", 1980, "REF001"},
			},
		},
		{
			name: "Cards",
			rows: [][]any{
				{
					"Card Name", "Date", "Bout Number", "Bout Type",
					"Red Athlete", "Blue Athlete", "Round Length", "Glove Size",
				},
				{
					"Test Card", "2026-05-01", 1, "scored",
					"Jane Smith", "Mark Jones", "3", "10oz",
				},
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
