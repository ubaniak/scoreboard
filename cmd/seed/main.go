// Seed the scoreboard SQLite database with a card + N bouts directly via the
// domain usecases (no HTTP). Optionally fully scores and completes every bout
// so reports/UI have realistic data to display.
//
// Examples:
//
//	go run ./cmd/seed                       # 100 bouts, 3 judges, default db
//	go run ./cmd/seed -bouts=20 -judges=5
//	go run ./cmd/seed -scored               # also score and complete every bout
//	go run ./cmd/seed -db=/tmp/test.db -card="Demo Night"
//	go run ./cmd/seed -clear                # wipe bouts of an existing card first
package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/ubaniak/scoreboard/internal/creation/athletes"
	"github.com/ubaniak/scoreboard/internal/bouts"
	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/creation/cards"
	cardEntities "github.com/ubaniak/scoreboard/internal/creation/cards/entities"
	"github.com/ubaniak/scoreboard/internal/running/comment"
	"github.com/ubaniak/scoreboard/internal/datadir"
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/running/round"
	"github.com/ubaniak/scoreboard/internal/scores"
)

var firstNames = []string{
	"Aiden", "Bianca", "Carlos", "Diana", "Ethan", "Fiona", "Gabriel", "Hana",
	"Ivan", "Jasmine", "Kai", "Lila", "Mateo", "Nora", "Omar", "Priya",
	"Quentin", "Riya", "Santiago", "Tara", "Uma", "Viktor", "Wren", "Xavier",
	"Yara", "Zane", "Amara", "Boris", "Cleo", "Dimitri", "Esme", "Felix",
	"Gita", "Hugo", "Imani", "Jonas", "Kira", "Leon", "Maya", "Nikolai",
	"Olive", "Pablo", "Quinn", "Rafael", "Sasha", "Theo", "Uli", "Vera",
}

var lastNames = []string{
	"Adams", "Brennan", "Castillo", "Davenport", "Eriksen", "Ferreira",
	"Gallagher", "Huang", "Ibarra", "Jensen", "Kowalski", "Lindqvist",
	"Morales", "Nakamura", "Okonkwo", "Petrov", "Quiroga", "Ramirez",
	"Singh", "Tanaka", "Ueda", "Vasquez", "Walsh", "Xu", "Yamada", "Zaitsev",
	"Andersson", "Bukowski", "Cervantes", "Dubois", "Esposito", "Fernandez",
	"Goldstein", "Haddad", "Iqbal", "Johansson", "Kobayashi", "Larsen",
	"Mensah", "Novak", "Oconnor", "Pavlov", "Quintana", "Robinson",
}

var clubs = []string{
	"Iron Fist BC", "Northside Boxing", "Crescent Gym", "Riverside Athletic",
	"Hilltop Boxing Club", "Old Town BC", "Eastside Boxing", "Westgate Gym",
	"Phoenix Boxing", "Apex Athletics", "Lighthouse BC", "Summit Boxing",
}

func randomName(rng *rand.Rand) string {
	return firstNames[rng.Intn(len(firstNames))] + " " + lastNames[rng.Intn(len(lastNames))]
}

func randomClub(rng *rand.Rand) string {
	return clubs[rng.Intn(len(clubs))]
}

func main() {
	var (
		dbPath   = flag.String("db", "", "path to scoreboard.db (defaults to app data dir)")
		cardName = flag.String("card", "Seed Card", "card name")
		date     = flag.String("date", time.Now().Format("2006-01-02"), "card date (YYYY-MM-DD)")
		boutN    = flag.Int("bouts", 100, "number of bouts to create")
		judgeN   = flag.Int("judges", 3, "number of judges (1..5)")
		clear    = flag.Bool("clear", false, "delete existing bouts on the card before seeding")
		scored   = flag.Bool("scored", false, "score and complete every bout (judges pick random winner per round)")
		seedRNG  = flag.Int64("seed", 0, "RNG seed (0 = time-based)")
		activate = flag.Bool("activate", true, "set the card status to in_progress")
		noNames  = flag.Bool("no-athletes", false, "skip creating athletes — leaves bout corners empty")
	)
	flag.Parse()

	if *judgeN < 1 || *judgeN > 5 {
		log.Fatalf("-judges must be 1..5 (got %d)", *judgeN)
	}
	if *boutN < 1 {
		log.Fatalf("-bouts must be >= 1")
	}

	if *dbPath == "" {
		p, err := datadir.DBPath()
		if err != nil {
			log.Fatalf("resolve db path: %v", err)
		}
		*dbPath = p
	}
	log.Printf("db=%s card=%q bouts=%d judges=%d scored=%v", *dbPath, *cardName, *boutN, *judgeN, *scored)

	rngSeed := *seedRNG
	if rngSeed == 0 {
		rngSeed = time.Now().UnixNano()
	}
	rng := rand.New(rand.NewSource(rngSeed))

	db, err := gorm.Open(sqlite.Open(*dbPath), &gorm.Config{Logger: gormlogger.Default.LogMode(gormlogger.Silent)})
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	scoreStorage, err := scores.NewSqlite(db)
	if err != nil {
		log.Fatalf("score storage: %v", err)
	}
	scoreUC := scores.NewUseCase(scoreStorage)

	roundStorage, err := round.NewStorage(db)
	if err != nil {
		log.Fatalf("round storage: %v", err)
	}
	roundUC := round.NewUseCase(roundStorage)

	commentStorage, err := comment.NewSqlite(db)
	if err != nil {
		log.Fatalf("comment storage: %v", err)
	}
	commentUC := comment.NewUseCase(commentStorage)

	cardStorage, err := cards.NewCardStorage(db)
	if err != nil {
		log.Fatalf("card storage: %v", err)
	}
	cardUC := cards.NewUseCase(cardStorage)

	boutStorage, err := bouts.NewSqlite(db)
	if err != nil {
		log.Fatalf("bout storage: %v", err)
	}
	boutUC := bouts.NewUseCase(boutStorage, roundUC, commentUC, scoreUC)

	athleteStorage, err := athletes.NewSqlite(db)
	if err != nil {
		log.Fatalf("athlete storage: %v", err)
	}
	athleteUC := athletes.NewUseCase(athleteStorage)

	cardID, err := cardUC.FindOrCreateByName(*cardName, *date)
	if err != nil {
		log.Fatalf("find/create card: %v", err)
	}

	cardUpdate := &cardEntities.UpdateCard{NumberOfJudges: judgeN}
	if *activate {
		s := string(cardEntities.CardStatusInProgress)
		cardUpdate.Status = &s
	}
	if err := cardUC.Update(cardID, cardUpdate); err != nil {
		log.Fatalf("update card: %v", err)
	}

	if *clear {
		existing, err := boutUC.List(cardID)
		if err != nil {
			log.Fatalf("list bouts: %v", err)
		}
		log.Printf("clearing %d existing bouts", len(existing))
		for _, b := range existing {
			if err := boutUC.Delete(cardID, b.ID); err != nil {
				log.Fatalf("delete bout %d: %v", b.ID, err)
			}
		}
	}

	log.Printf("creating %d bouts", *boutN)
	for i := 1; i <= *boutN; i++ {
		b := &boutEntities.Bout{
			CardID:         cardID,
			BoutNumber:     i,
			Gender:         boutEntities.Male,
			AgeCategory:    boutEntities.Elite,
			Experience:     boutEntities.Open,
			RoundLength:    boutEntities.TwoMinutes,
			GloveSize:      boutEntities.TwelveOz,
			BoutType:       boutEntities.BoutTypeScored,
			NumberOfJudges: *judgeN,
			Status:         boutEntities.BoutStatusNotStarted,
			WeightClass:    70,
		}
		if !*noNames {
			redID, err := athleteUC.FindOrCreateByName(randomName(rng), randomClub(rng))
			if err != nil {
				log.Fatalf("create red athlete for bout %d: %v", i, err)
			}
			blueID, err := athleteUC.FindOrCreateByName(randomName(rng), randomClub(rng))
			if err != nil {
				log.Fatalf("create blue athlete for bout %d: %v", i, err)
			}
			b.RedAthleteID = &redID
			b.BlueAthleteID = &blueID
		}
		if err := boutUC.Create(cardID, b); err != nil {
			log.Fatalf("create bout %d: %v", i, err)
		}
	}

	if !*scored {
		fmt.Println(strings.Repeat("-", 50))
		fmt.Printf("seeded card %q (id=%d) with %d bouts, %d judges (status=%s)\n",
			*cardName, cardID, *boutN, *judgeN, cardStatus(*activate))
		return
	}

	// Fully score + complete each bout so reports/UI have realistic data.
	roles := rbac.JudgeList[:*judgeN]
	created, err := boutUC.List(cardID)
	if err != nil {
		log.Fatalf("list bouts after create: %v", err)
	}
	log.Printf("scoring %d bouts with %d judges", len(created), *judgeN)
	for _, b := range created {
		// Pick a panel winner once, then have judges agree.
		panelRed := rng.Intn(2) == 0
		for rn := 1; rn <= 3; rn++ {
			for _, role := range roles {
				name := fmt.Sprintf("Judge %s", strings.TrimPrefix(role, "judge"))
				if err := scoreUC.Ready(cardID, b.ID, rn, role, name); err != nil {
					log.Fatalf("ready bout=%d r=%d %s: %v", b.ID, rn, role, err)
				}
				red, blue := 10, 9
				if !panelRed {
					red, blue = 9, 10
				}
				if err := scoreUC.Score(cardID, b.ID, rn, role, red, blue); err != nil {
					log.Fatalf("score bout=%d r=%d %s: %v", b.ID, rn, role, err)
				}
				if err := scoreUC.Complete(cardID, b.ID, rn, role); err != nil {
					log.Fatalf("complete bout=%d r=%d %s: %v", b.ID, rn, role, err)
				}
			}
		}
		winner := "red"
		if !panelRed {
			winner = "blue"
		}
		for _, role := range roles {
			if err := scoreUC.SetOverallWinner(cardID, b.ID, role, winner); err != nil {
				log.Fatalf("overall bout=%d %s: %v", b.ID, role, err)
			}
		}
		if err := boutUC.MakeDecision(cardID, b.ID, winner, "unanimous", ""); err != nil {
			log.Fatalf("make decision bout=%d: %v", b.ID, err)
		}
		if err := boutUC.Complete(cardID, b.ID); err != nil {
			log.Fatalf("complete bout=%d: %v", b.ID, err)
		}
	}

	fmt.Println(strings.Repeat("-", 50))
	fmt.Printf("seeded card %q (id=%d) with %d scored+completed bouts, %d judges\n",
		*cardName, cardID, *boutN, *judgeN)
}

func cardStatus(active bool) string {
	if active {
		return "in_progress"
	}
	return "upcoming"
}
