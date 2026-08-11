// Seed the scoreboard SQLite database with a card + N bouts directly via the
// domain usecases (no HTTP). Optionally fully scores and completes a subset
// of bouts, registers officials, and spreads athletes across a set of clubs,
// so reports/UI have realistic data to display.
//
// Examples:
//
//	go run ./cmd/seed                       # 100 bouts, 3 judges, default db
//	go run ./cmd/seed -bouts=20 -judges=5
//	go run ./cmd/seed -scored               # also score and complete every bout
//	go run ./cmd/seed -done=5 -clubs=5 -officials=10
//	go run ./cmd/seed -db=/tmp/test.db -card="Demo Night"
//	go run ./cmd/seed -clear                # wipe bouts of an existing card first
package main

import (
	"flag"
	"log"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/ubaniak/scoreboard/internal/affiliations"
	"github.com/ubaniak/scoreboard/internal/athletes"
	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/comment"
	"github.com/ubaniak/scoreboard/internal/datadir"
	"github.com/ubaniak/scoreboard/internal/officials"
	"github.com/ubaniak/scoreboard/internal/round"
	"github.com/ubaniak/scoreboard/internal/scores"
	"github.com/ubaniak/scoreboard/internal/seed"
)

func main() {
	var (
		dbPath    = flag.String("db", "", "path to scoreboard.db (defaults to app data dir)")
		cardName  = flag.String("card", "Seed Card", "card name")
		date      = flag.String("date", time.Now().Format("2006-01-02"), "card date (YYYY-MM-DD)")
		boutN     = flag.Int("bouts", 100, "number of bouts to create")
		judgeN    = flag.Int("judges", 3, "number of judges (1..5)")
		clear     = flag.Bool("clear", false, "delete existing bouts on the card before seeding")
		scored    = flag.Bool("scored", false, "score and complete every bout (judges pick random winner per round)")
		doneN     = flag.Int("done", 0, "number of bouts to fully score+complete, in order (overridden to all by -scored)")
		clubN     = flag.Int("clubs", seed.MaxClubs, "number of clubs to draw athletes from (from built-in list)")
		officialN = flag.Int("officials", 0, "number of officials to register")
		seedRNG   = flag.Int64("seed", 0, "RNG seed (0 = time-based)")
		activate  = flag.Bool("activate", true, "set the card status to in_progress")
		noNames   = flag.Bool("no-athletes", false, "skip creating athletes — leaves bout corners empty")
	)
	flag.Parse()

	if *dbPath == "" {
		p, err := datadir.DBPath()
		if err != nil {
			log.Fatalf("resolve db path: %v", err)
		}
		*dbPath = p
	}
	log.Printf("db=%s card=%q bouts=%d judges=%d scored=%v", *dbPath, *cardName, *boutN, *judgeN, *scored)

	db, err := gorm.Open(sqlite.Open(*dbPath), &gorm.Config{Logger: gormlogger.Default.LogMode(gormlogger.Silent)})
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	deps, err := buildDeps(db)
	if err != nil {
		log.Fatalf("build deps: %v", err)
	}

	toScore := *doneN
	if *scored {
		toScore = *boutN
	}

	result, err := seed.Run(deps, seed.Options{
		CardName:   *cardName,
		Date:       *date,
		Bouts:      *boutN,
		Judges:     *judgeN,
		Done:       toScore,
		Clubs:      *clubN,
		Officials:  *officialN,
		Clear:      *clear,
		Activate:   *activate,
		NoAthletes: *noNames,
		RNGSeed:    *seedRNG,
	})
	if err != nil {
		log.Fatalf("seed: %v", err)
	}

	log.Println(result.String())
}

func buildDeps(db *gorm.DB) (seed.Deps, error) {
	scoreStorage, err := scores.NewSqlite(db)
	if err != nil {
		return seed.Deps{}, err
	}
	scoreUC := scores.NewUseCase(scoreStorage)

	roundStorage, err := round.NewStorage(db)
	if err != nil {
		return seed.Deps{}, err
	}
	roundUC := round.NewUseCase(roundStorage)

	commentStorage, err := comment.NewSqlite(db)
	if err != nil {
		return seed.Deps{}, err
	}
	commentUC := comment.NewUseCase(commentStorage)

	cardStorage, err := cards.NewCardStorage(db)
	if err != nil {
		return seed.Deps{}, err
	}
	cardUC := cards.NewUseCase(cardStorage)

	boutStorage, err := bouts.NewSqlite(db)
	if err != nil {
		return seed.Deps{}, err
	}
	boutUC := bouts.NewUseCase(boutStorage, roundUC, commentUC, scoreUC)

	athleteStorage, err := athletes.NewSqlite(db)
	if err != nil {
		return seed.Deps{}, err
	}
	athleteUC := athletes.NewUseCase(athleteStorage)

	officialStorage, err := officials.NewSqlite(db)
	if err != nil {
		return seed.Deps{}, err
	}
	officialUC := officials.NewUseCase(officialStorage)

	affiliationStorage, err := affiliations.NewSqlite(db)
	if err != nil {
		return seed.Deps{}, err
	}
	affiliationUC := affiliations.NewUseCase(affiliationStorage)

	return seed.Deps{
		Cards:        cardUC,
		Bouts:        boutUC,
		Athletes:     athleteUC,
		Affiliations: affiliationUC,
		Officials:    officialUC,
		Scores:       scoreUC,
	}, nil
}
