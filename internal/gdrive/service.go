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
}

type BoutCreator interface {
	CreateBulk(cardId uint, bouts []*boutEntities.Bout) error
	GetNumberOfJudges(cardId uint) (int, error)
}

type CardFinderCreator interface {
	FindOrCreateByName(name, date string) (uint, error)
}

type ReportBuilder interface {
	FullReport(cardId uint) (*reportsPackage.ReportData, error)
	PublicReport(cardId uint) (*reportsPackage.ReportData, error)
	ConsistencyReport(cardId uint) (*reportsPackage.ConsistencyReport, error)
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

	// ── Affiliations (single sheet, name + type) ─────────────────────────────
	hdr, rows, err := s.sheetRows(ctx, sheetID, "Affiliations")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		typeIdx := colIdx(hdr, "Type")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			switch strings.ToLower(cell(row, typeIdx)) {
			case "province":
				if _, err := s.clubs.FindOrCreateProvince(name); err == nil {
					res.Provinces++
				}
			case "nation":
				if _, err := s.clubs.FindOrCreateNation(name); err == nil {
					res.Nations++
				}
			default:
				if _, err := s.clubs.FindOrCreateByName(name); err == nil {
					res.Clubs++
				}
			}
		}
	}

	// ── Clubs (legacy single-type sheet) ─────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Clubs")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			if _, err := s.clubs.FindOrCreateByName(name); err == nil {
				res.Clubs++
			}
		}
	}

	// ── Provinces ────────────────────────────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Provinces")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			if _, err := s.clubs.FindOrCreateProvince(name); err == nil {
				res.Provinces++
			}
		}
	}

	// ── Nations ──────────────────────────────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Nations")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			if _, err := s.clubs.FindOrCreateNation(name); err == nil {
				res.Nations++
			}
		}
	}

	// ── Athletes ─────────────────────────────────────────────────────────────
	hdr, rows, err = s.sheetRows(ctx, sheetID, "Athletes")
	if err == nil && len(rows) > 0 {
		nameIdx := colIdx(hdr, "Name")
		clubIdx := colIdx(hdr, "Club")
		for _, row := range rows {
			name := cell(row, nameIdx)
			if name == "" {
				continue
			}
			var clubID *uint
			if clubName := cell(row, clubIdx); clubName != "" {
				if id, err := s.clubs.FindOrCreateByName(clubName); err == nil {
					clubID = &id
				}
			}
			if _, err := s.athletes.FindOrCreateByNameAndClub(name, clubID); err == nil {
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
	redClubIdx := colIdx(hdr, "Red Club")
	blueAthleteIdx := colIdx(hdr, "Blue Athlete")
	blueClubIdx := colIdx(hdr, "Blue Club")
	ageCatIdx := colIdx(hdr, "Age Category")
	expIdx := colIdx(hdr, "Experience")
	genderIdx := colIdx(hdr, "Gender")
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

		ageCategory := mapAgeCategory(cell(row, ageCatIdx))
		experience := boutEntities.Experience(strings.ToLower(cell(row, expIdx)))
		gender := boutEntities.Gender(strings.ToLower(cell(row, genderIdx)))
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
			BoutNumber:  boutNum,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			RoundLength: roundLen,
			GloveSize:   gloveSize,
			BoutType:    boutType,
			Status:      boutEntities.BoutStatusNotStarted,
		}

		if redName := cell(row, redAthleteIdx); redName != "" {
			var clubID *uint
			if redClub := cell(row, redClubIdx); redClub != "" {
				if id, err := s.clubs.FindOrCreateByName(redClub); err == nil {
					clubID = &id
				}
			}
			if id, err := s.athletes.FindOrCreateByNameAndClub(redName, clubID); err == nil {
				bout.RedAthleteID = &id
			}
		}
		if blueName := cell(row, blueAthleteIdx); blueName != "" {
			var clubID *uint
			if blueClub := cell(row, blueClubIdx); blueClub != "" {
				if id, err := s.clubs.FindOrCreateByName(blueClub); err == nil {
					clubID = &id
				}
			}
			if id, err := s.athletes.FindOrCreateByNameAndClub(blueName, clubID); err == nil {
				bout.BlueAthleteID = &id
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
		if err := s.bouts.CreateBulk(cardID, bouts); err == nil {
			imported += len(bouts)
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

	// Judge Consistency Report CSV
	consRd, err := s.reports.ConsistencyReport(cardId)
	if err == nil {
		var consBuf bytes.Buffer
		if err := reportsPackage.WriteConsistencyCSV(&consBuf, consRd); err == nil {
			consName := fmt.Sprintf("consistency_report_%s_%s.csv", sanitiseName(consRd.CardName), consRd.CardDate)
			if link, err := s.upload(ctx, svc, consName, &consBuf, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: consName, Link: link})
			}
		}

		// Judge Consistency Report PDF
		var consPdfBuf bytes.Buffer
		if err := reportsPackage.WriteConsistencyPDF(&consPdfBuf, consRd); err == nil {
			consPdfName := fmt.Sprintf("consistency_report_%s_%s.pdf", sanitiseName(consRd.CardName), consRd.CardDate)
			if link, err := s.upload(ctx, svc, consPdfName, &consPdfBuf, folderID); err == nil {
				result.Files = append(result.Files, ExportedFile{Name: consPdfName, Link: link})
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
			{Properties: &sheetsAPI.SheetProperties{Title: "Affiliations"}},
			{Properties: &sheetsAPI.SheetProperties{Title: "Clubs"}},
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
			name: "Affiliations",
			rows: [][]any{
				{"Name", "Type"},
				{"City Boxing", "club"},
				{"Auckland", "province"},
				{"New Zealand", "nation"},
			},
		},
		{
			name: "Clubs",
			rows: [][]any{
				{"Name", "Location"},
				{"City Boxing", "Auckland"},
				{"North Stars", "Wellington"},
			},
		},
		{
			name: "Athletes",
			rows: [][]any{
				{"Name", "Age Category", "Nationality", "Club"},
				{"Jane Smith", "Elite", "NZL", "City Boxing"},
				{"Mark Jones", "U17", "NZL", "North Stars"},
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
			name: "Cards",
			rows: [][]any{
				{
					"Card Name", "Date", "Bout Number", "Bout Type",
					"Red Athlete", "Red Club", "Blue Athlete", "Blue Club",
					"Age Category", "Experience", "Gender", "Round Length", "Glove Size",
				},
				{
					"Test Card", "2026-05-01", 1, "scored",
					"Jane Smith", "City Boxing", "Mark Jones", "North Stars",
					"Elite", "novice", "female", "3", "10oz",
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
