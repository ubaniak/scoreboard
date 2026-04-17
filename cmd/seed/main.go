package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"

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
	"github.com/ubaniak/scoreboard/internal/officials"
	"github.com/ubaniak/scoreboard/internal/round"
	"github.com/ubaniak/scoreboard/internal/scores"
)

var redNames = []string{
	"Liam Carter", "Noah Bennett", "Ethan Collins", "Mason Hughes", "Lucas Mitchell",
	"Oliver Grant", "James Rivera", "Aiden Brooks", "Logan Foster", "Elijah Reed",
	"Jackson Perry", "Sebastian Price", "Mateo Hayes", "Henry Russell", "Alexander Ward",
	"Daniel Cox", "Michael Barnes", "Owen Bell", "Dylan Powell", "Ryan Butler",
	"Christian Simmons", "Eli Ross", "Aaron Henderson", "Connor Griffin", "Hunter Wood",
	"Thomas Watson", "Cameron Brooks", "Jordan Gray", "Colton Baker", "Wyatt James",
	"Dominic Kelly", "Austin Evans", "Brody Sanders", "Nolan Nelson", "Isaiah Cooper",
	"Jaxon Richardson", "Landon Morris", "Tyler Rogers", "Brandon Jenkins", "Cole Murphy",
	"Adrian Bailey", "Carson Rivera", "Jeremiah Flores", "Sawyer Fisher", "Tristan Greene",
	"Chase Howard", "Blake King", "Ryder Scott", "Gavin Long", "Zane Hill",
}

var blueNames = []string{
	"Emma Taylor", "Olivia Martinez", "Ava Thompson", "Sophia White", "Isabella Harris",
	"Mia Clark", "Amelia Lewis", "Harper Robinson", "Evelyn Walker", "Abigail Young",
	"Emily Allen", "Elizabeth Hall", "Sofia Wright", "Avery King", "Ella Scott",
	"Grace Turner", "Victoria Baker", "Chloe Nelson", "Penelope Carter", "Riley Mitchell",
	"Layla Perez", "Lillian Roberts", "Nora Phillips", "Zoey Campbell", "Mila Parker",
	"Aurora Evans", "Hannah Edwards", "Addison Collins", "Ellie Stewart", "Stella Sanchez",
	"Leah Morris", "Hazel Rogers", "Audrey Reed", "Scarlett Cook", "Lucy Morgan",
	"Paisley Bell", "Skylar Murphy", "Eliana Bailey", "Caroline Cooper", "Nova Richardson",
	"Genesis Cox", "Aaliyah Howard", "Kennedy Ward", "Savannah Torres", "Brooklyn Peterson",
	"Anna Gray", "Claire Ramirez", "Madelyn James", "Arianna Watson", "Autumn Foster",
}

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

var officialNames = []string{
	"James Doyle", "Robert Hicks", "William Torres", "Michael Flynn", "David Ortega",
	"Richard Stone", "Charles Webb", "Thomas Nolan", "Christopher Shaw", "Daniel Cruz",
	"Matthew Bell", "Anthony Page", "Mark Jensen", "Donald Carr", "Steven Malone",
	"Paul Garrett", "Andrew Tran", "Joshua Lane", "Kenneth Marsh", "Kevin Byrne",
}

var seedClubs = []clubEntities.Club{
	{Name: "Eastside Boxing Club", Location: "Toronto, ON"},
	{Name: "Westside Warriors", Location: "Vancouver, BC"},
	{Name: "Northgate Academy", Location: "Calgary, AB"},
	{Name: "Southpaw Gym", Location: "Montreal, QC"},
	{Name: "Central City Boxing", Location: "Ottawa, ON"},
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

func main() {
	const dbPath = "scoreboard.db"

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

	// Create clubs
	clubIDs := make([]uint, len(seedClubs))
	for i, c := range seedClubs {
		if err := clubUseCase.Create(c.Name, c.Location); err != nil {
			log.Fatalf("create club %s: %v", c.Name, err)
		}
		allClubs, err := clubUseCase.List()
		if err != nil {
			log.Fatalf("list clubs: %v", err)
		}
		clubIDs[i] = allClubs[len(allClubs)-1].ID
	}
	fmt.Printf("Created %d clubs.\n", len(clubIDs))

	// Create athletes
	athleteIDs := make([]uint, len(seedAthletes))
	for i, a := range seedAthletes {
		clubID := clubIDs[a.clubIndex]
		if err := athleteUseCase.Create(a.name, a.dateOfBirth, &clubID); err != nil {
			log.Fatalf("create athlete %s: %v", a.name, err)
		}
		allAthletes, err := athleteUseCase.List()
		if err != nil {
			log.Fatalf("list athletes: %v", err)
		}
		athleteIDs[i] = allAthletes[len(allAthletes)-1].ID
	}
	fmt.Printf("Created %d athletes.\n", len(athleteIDs))

	// Create card
	if err := cardUseCase.Create("Fight Night 2026", "2026-04-14"); err != nil {
		log.Fatalf("create card: %v", err)
	}
	cardList, err := cardUseCase.List()
	if err != nil {
		log.Fatalf("list cards: %v", err)
	}
	cardID := cardList[len(cardList)-1].ID
	fmt.Printf("Created card id=%d\n", cardID)

	// Create 100 bouts; first 20 are linked to seeded athletes
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
			RedCorner:      redNames[(i-1)%len(redNames)],
			BlueCorner:     blueNames[(i-1)%len(blueNames)],
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

	// Create 20 officials
	if err := officialUseCase.CreateBulk(cardID, officialNames); err != nil {
		log.Fatalf("create officials: %v", err)
	}
	fmt.Println("Created 20 officials.")
	fmt.Println("Created 100 bouts (first 10 linked to seeded athletes).")
	fmt.Println("Done. Run ./scoreboard to start.")
}
