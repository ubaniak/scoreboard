package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"log"
	"math"
	"math/rand"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/ubaniak/scoreboard/internal/athletes"
	"github.com/ubaniak/scoreboard/internal/bouts"
	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/clubs"
	clubEntities "github.com/ubaniak/scoreboard/internal/clubs/entities"
	"github.com/ubaniak/scoreboard/internal/comment"
	"github.com/ubaniak/scoreboard/internal/datadir"
	"github.com/ubaniak/scoreboard/internal/officials"
	officialEntities "github.com/ubaniak/scoreboard/internal/officials/entities"
	"github.com/ubaniak/scoreboard/internal/round"
	"github.com/ubaniak/scoreboard/internal/scores"
)

var ageCategories = []boutEntities.AgeCategory{
	boutEntities.Elite, boutEntities.Elite, boutEntities.Elite,
	boutEntities.Masters, boutEntities.Youth,
	boutEntities.JuniorA, boutEntities.JuniorB,
}

var experiences = []boutEntities.Experience{
	boutEntities.Open, boutEntities.Open, boutEntities.Novice,
}

var weightClasses = []int{54, 57, 60, 63, 67, 71, 75, 80, 86, 92}

var genders = []boutEntities.Gender{boutEntities.Male, boutEntities.Female}

var seedOfficialData = []officialEntities.Official{
	{Name: "James Doyle", Nationality: "Canadian", Gender: "male", YearOfBirth: 1972, RegistrationNumber: "CAN-1001"},
	{Name: "Robert Hicks", Nationality: "Canadian", Gender: "male", YearOfBirth: 1968, RegistrationNumber: "CAN-1002"},
	{Name: "William Torres", Nationality: "Mexican", Gender: "male", YearOfBirth: 1975, RegistrationNumber: "MEX-2001"},
	{Name: "Michael Flynn", Nationality: "American", Gender: "male", YearOfBirth: 1980, RegistrationNumber: "USA-3001"},
	{Name: "David Ortega", Nationality: "Mexican", Gender: "male", YearOfBirth: 1977, RegistrationNumber: "MEX-2002"},
	{Name: "Richard Stone", Nationality: "Canadian", Gender: "male", YearOfBirth: 1965, RegistrationNumber: "CAN-1003"},
	{Name: "Charles Webb", Nationality: "American", Gender: "male", YearOfBirth: 1983, RegistrationNumber: "USA-3002"},
	{Name: "Thomas Nolan", Nationality: "Canadian", Gender: "male", YearOfBirth: 1970, RegistrationNumber: "CAN-1004"},
	{Name: "Christopher Shaw", Nationality: "American", Gender: "male", YearOfBirth: 1978, RegistrationNumber: "USA-3003"},
	{Name: "Daniel Cruz", Nationality: "Mexican", Gender: "male", YearOfBirth: 1985, RegistrationNumber: "MEX-2003"},
	{Name: "Sarah Mitchell", Nationality: "Canadian", Gender: "female", YearOfBirth: 1982, RegistrationNumber: "CAN-1005"},
	{Name: "Anthony Page", Nationality: "American", Gender: "male", YearOfBirth: 1973, RegistrationNumber: "USA-3004"},
	{Name: "Laura Jensen", Nationality: "Canadian", Gender: "female", YearOfBirth: 1979, RegistrationNumber: "CAN-1006"},
	{Name: "Donald Carr", Nationality: "American", Gender: "male", YearOfBirth: 1966, RegistrationNumber: "USA-3005"},
	{Name: "Steven Malone", Nationality: "Canadian", Gender: "male", YearOfBirth: 1974, RegistrationNumber: "CAN-1007"},
	{Name: "Paul Garrett", Nationality: "American", Gender: "male", YearOfBirth: 1981, RegistrationNumber: "USA-3006"},
	{Name: "Andrew Tran", Nationality: "Canadian", Gender: "male", YearOfBirth: 1988, RegistrationNumber: "CAN-1008"},
	{Name: "Joshua Lane", Nationality: "American", Gender: "male", YearOfBirth: 1976, RegistrationNumber: "USA-3007"},
	{Name: "Kenneth Marsh", Nationality: "Canadian", Gender: "male", YearOfBirth: 1969, RegistrationNumber: "CAN-1009"},
	{Name: "Kevin Byrne", Nationality: "Canadian", Gender: "male", YearOfBirth: 1984, RegistrationNumber: "CAN-1010"},
}

var seedClubs = []clubEntities.Club{
	{Name: "Eastside Boxing Club", Location: "Toronto, ON"},
	{Name: "Westside Warriors", Location: "Vancouver, BC"},
	{Name: "Northgate Academy", Location: "Calgary, AB"},
	{Name: "Southpaw Gym", Location: "Montreal, QC"},
	{Name: "Central City Boxing", Location: "Ottawa, ON"},
}

// Club accent colours (R, G, B)
var clubColors = [][3]uint8{
	{185, 28, 28},  // red
	{29, 78, 216},  // blue
	{21, 128, 61},  // green
	{109, 40, 217}, // purple
	{180, 130, 20}, // gold
}

var seedAthletes = []struct {
	name        string
	dateOfBirth string
	clubIndex   int
}{
	{"Liam Carter", "2001-03-12", 0},
	{"Noah Bennett", "2000-07-25", 0},
	{"Ethan Collins", "2002-01-08", 1},
	{"Mason Hughes", "1999-11-30", 1},
	{"Lucas Mitchell", "2003-05-14", 2},
	{"Oliver Grant", "2001-09-22", 2},
	{"James Rivera", "2000-02-17", 3},
	{"Aiden Brooks", "2002-06-03", 3},
	{"Logan Foster", "1998-12-19", 4},
	{"Elijah Reed", "2001-08-07", 4},
	{"Emma Taylor", "2002-04-11", 0},
	{"Olivia Martinez", "2000-10-28", 0},
	{"Ava Thompson", "2003-02-05", 1},
	{"Sophia White", "2001-07-16", 1},
	{"Isabella Harris", "1999-05-23", 2},
	{"Mia Clark", "2002-11-09", 2},
	{"Amelia Lewis", "2000-03-30", 3},
	{"Harper Robinson", "2003-08-14", 3},
	{"Evelyn Walker", "2001-01-26", 4},
	{"Abigail Young", "2000-06-18", 4},
}

// ── image helpers ─────────────────────────────────────────────────────────────

// circleAvatar creates a size×size PNG: a filled circle of the given colour
// centred on a dark background.
func circleAvatar(size int, r, g, b uint8) []byte {
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	bg := color.RGBA{R: 15, G: 20, B: 35, A: 255}
	fg := color.RGBA{R: r, G: g, B: b, A: 255}
	cx, cy := float64(size)/2, float64(size)/2
	radius := float64(size)/2 - 4
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			dx := float64(x) - cx
			dy := float64(y) - cy
			if math.Sqrt(dx*dx+dy*dy) <= radius {
				img.Set(x, y, fg)
			} else {
				img.Set(x, y, bg)
			}
		}
	}
	var buf bytes.Buffer
	_ = png.Encode(&buf, img)
	return buf.Bytes()
}

// gradientBanner creates a w×h PNG that fades horizontally from one colour to
// another, overlaid with a subtle dark vignette so text stays readable.
func gradientBanner(w, h int, r1, g1, b1, r2, g2, b2 uint8) []byte {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for x := 0; x < w; x++ {
		t := float64(x) / float64(w-1)
		r := uint8(float64(r1)*(1-t) + float64(r2)*t)
		g := uint8(float64(g1)*(1-t) + float64(g2)*t)
		b := uint8(float64(b1)*(1-t) + float64(b2)*t)
		for y := 0; y < h; y++ {
			// vignette: darken edges top/bottom
			vy := float64(y) / float64(h-1)
			factor := 1.0 - 0.35*math.Pow(2*vy-1, 2)
			img.Set(x, y, color.RGBA{
				R: uint8(float64(r) * factor),
				G: uint8(float64(g) * factor),
				B: uint8(float64(b) * factor),
				A: 255,
			})
		}
	}
	var buf bytes.Buffer
	_ = png.Encode(&buf, img)
	return buf.Bytes()
}

func saveImage(dir string, id uint, data []byte) (string, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	path := filepath.Join(dir, fmt.Sprintf("%d.png", id))
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", err
	}
	return path, nil
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	dbPath, err := datadir.DBPath()
	if err != nil {
		log.Fatalf("data dir: %v", err)
	}

	uploadsDir, err := datadir.UploadsDir()
	if err != nil {
		log.Fatalf("uploads dir: %v", err)
	}

	if err := os.Remove(dbPath); err != nil && !os.IsNotExist(err) {
		log.Fatalf("remove db: %v", err)
	}
	fmt.Println("Removed existing database.")

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	// Initialise all storage (runs AutoMigrate for each domain)
	commentStorage, err := comment.NewSqlite(db)
	if err != nil {
		log.Fatalf("comment storage: %v", err)
	}
	commentsUseCase := comment.NewUseCase(commentStorage)

	scoreStorage, err := scores.NewSqlite(db)
	if err != nil {
		log.Fatalf("scores storage: %v", err)
	}
	scoreUseCase := scores.NewUseCase(scoreStorage)

	roundStorage, err := round.NewStorage(db)
	if err != nil {
		log.Fatalf("round storage: %v", err)
	}
	roundUseCase := round.NewUseCase(roundStorage)

	cardStorage, err := cards.NewCardStorage(db)
	if err != nil {
		log.Fatalf("card storage: %v", err)
	}
	cardUseCase := cards.NewUseCase(cardStorage)

	officialStorage, err := officials.NewSqlite(db)
	if err != nil {
		log.Fatalf("officials storage: %v", err)
	}
	officialUseCase := officials.NewUseCase(officialStorage)

	clubStorage, err := clubs.NewSqlite(db)
	if err != nil {
		log.Fatalf("clubs storage: %v", err)
	}
	clubUseCase := clubs.NewUseCase(clubStorage)

	athleteStorage, err := athletes.NewSqlite(db)
	if err != nil {
		log.Fatalf("athletes storage: %v", err)
	}
	athleteUseCase := athletes.NewUseCase(athleteStorage)

	boutStorage, err := bouts.NewSqlite(db)
	if err != nil {
		log.Fatalf("bouts storage: %v", err)
	}
	boutUseCase := bouts.NewUseCase(boutStorage, roundUseCase, commentsUseCase, scoreUseCase)

	// ── clubs ────────────────────────────────────────────────────────────────
	clubIDs := make([]uint, len(seedClubs))
	for i, c := range seedClubs {
		if err := clubUseCase.Create(c.Name, c.Location); err != nil {
			log.Fatalf("create club %s: %v", c.Name, err)
		}
		allClubs, err := clubUseCase.List()
		if err != nil {
			log.Fatalf("list clubs: %v", err)
		}
		id := allClubs[len(allClubs)-1].ID
		clubIDs[i] = id

		// Generate and save club logo
		col := clubColors[i%len(clubColors)]
		img := circleAvatar(200, col[0], col[1], col[2])
		if _, err := saveImage(filepath.Join(uploadsDir, "clubs"), id, img); err != nil {
			log.Fatalf("save club image %d: %v", id, err)
		}
		url := fmt.Sprintf("/uploads/clubs/%d.png", id)
		if err := clubUseCase.SetImageUrl(id, url); err != nil {
			log.Fatalf("set club image url %d: %v", id, err)
		}
	}
	fmt.Printf("Created %d clubs with images.\n", len(clubIDs))

	// ── athletes ─────────────────────────────────────────────────────────────
	athleteIDs := make([]uint, len(seedAthletes))
	for i, a := range seedAthletes {
		clubID := clubIDs[a.clubIndex]
		if err := athleteUseCase.Create(a.name, a.dateOfBirth, "", &clubID, "", "", "", ""); err != nil {
			log.Fatalf("create athlete %s: %v", a.name, err)
		}
		allAthletes, err := athleteUseCase.List()
		if err != nil {
			log.Fatalf("list athletes: %v", err)
		}
		id := allAthletes[len(allAthletes)-1].ID
		athleteIDs[i] = id

		// Red corner athletes (0–9) get a warm colour; blue corner (10–19) get cool
		var img []byte
		if i < 10 {
			img = circleAvatar(200, 185, 28, 28) // red
		} else {
			img = circleAvatar(200, 29, 78, 216) // blue
		}
		if _, err := saveImage(filepath.Join(uploadsDir, "athletes"), id, img); err != nil {
			log.Fatalf("save athlete image %d: %v", id, err)
		}
		url := fmt.Sprintf("/uploads/athletes/%d.png", id)
		if err := athleteUseCase.SetImageUrl(id, url); err != nil {
			log.Fatalf("set athlete image url %d: %v", id, err)
		}
	}
	fmt.Printf("Created %d athletes with images.\n", len(athleteIDs))

	// ── card ─────────────────────────────────────────────────────────────────
	if err := cardUseCase.Create("Fight Night 2026", "2026-04-14"); err != nil {
		log.Fatalf("create card: %v", err)
	}
	cardList, err := cardUseCase.List()
	if err != nil {
		log.Fatalf("list cards: %v", err)
	}
	cardID := cardList[len(cardList)-1].ID

	// Dark red → dark navy gradient banner
	cardImg := gradientBanner(1200, 600, 120, 10, 10, 10, 15, 60)
	if _, err := saveImage(filepath.Join(uploadsDir, "cards"), cardID, cardImg); err != nil {
		log.Fatalf("save card image: %v", err)
	}
	if err := cardUseCase.SetImageUrl(cardID, fmt.Sprintf("/uploads/cards/%d.png", cardID)); err != nil {
		log.Fatalf("set card image url: %v", err)
	}
	fmt.Printf("Created card id=%d with image.\n", cardID)

	// ── bouts ─────────────────────────────────────────────────────────────────
	for i := 1; i <= 100; i++ {
		age := ageCategories[rand.Intn(len(ageCategories))]
		exp := experiences[rand.Intn(len(experiences))]
		gender := genders[rand.Intn(len(genders))]
		weight := weightClasses[rand.Intn(len(weightClasses))]

		gloveSize := boutEntities.TenOz
		if weight >= 80 {
			gloveSize = boutEntities.TwelveOz
		}

		bout := &boutEntities.Bout{
			BoutNumber:     i,
			AgeCategory:    age,
			Experience:     exp,
			Gender:         gender,
			WeightClass:    weight,
			GloveSize:      gloveSize,
			RoundLength:    boutEntities.TwoMinutes,
			Status:         boutEntities.BoutStatusNotStarted,
			BoutType:       boutEntities.BoutTypeScored,
			NumberOfJudges: 5,
		}

		// Link the first 10 red athletes and first 10 blue athletes to the first 10 bouts each
		redIdx := i - 1
		blueIdx := 10 + (i - 1)
		if redIdx < 10 {
			id := athleteIDs[redIdx]
			bout.RedAthleteID = &id
		}
		if blueIdx < len(athleteIDs) {
			id := athleteIDs[blueIdx]
			bout.BlueAthleteID = &id
		}

		if err := boutUseCase.Create(cardID, bout); err != nil {
			log.Fatalf("create bout %d: %v", i, err)
		}
	}

	// ── officials ─────────────────────────────────────────────────────────────
	seedOfficials := make([]*officialEntities.Official, len(seedOfficialData))
	for i := range seedOfficialData {
		o := seedOfficialData[i]
		seedOfficials[i] = &o
	}
	if err := officialUseCase.CreateBulk(seedOfficials); err != nil {
		log.Fatalf("create officials: %v", err)
	}
	fmt.Println("Created 20 officials.")
	fmt.Println("Created 100 bouts (first 10 linked to seeded athletes).")
	fmt.Println("Done. Run ./scoreboard to start.")
}
