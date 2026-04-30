package main

import (
	"flag"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards"
	cardEntities "github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/comment"
	"github.com/ubaniak/scoreboard/internal/datadir"
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/round"
	"github.com/ubaniak/scoreboard/internal/scores"
)

// Seeds a card "Judge Consistency Demo" with 10 scored bouts and 3 judges:
//   - Alice Consistent: always picks the panel winner (100% agreement)
//   - Carol Consistent: always picks the panel winner (100% agreement)
//   - Bob Inconsistent: always picks the loser (0% agreement)
// Two consistent judges are required so panel-majority calculation has a
// definitive winner each round; the report still shows Bob's 0% score
// against their 100%.
func main() {
	var dbPath string
	flag.StringVar(&dbPath, "db", "", "path to scoreboard.db (defaults to app data dir)")
	flag.Parse()

	if dbPath == "" {
		p, err := datadir.DBPath()
		if err != nil {
			log.Fatalf("resolve db path: %v", err)
		}
		dbPath = p
	}
	log.Printf("using db: %s", dbPath)

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{Logger: gormlogger.Default.LogMode(gormlogger.Silent)})
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

	const cardName = "Judge Consistency Demo"
	const numJudges = 3
	const totalBouts = 10

	cardId, err := cardUC.FindOrCreateByName(cardName, time.Now().Format("2006-01-02"))
	if err != nil {
		log.Fatalf("find/create card: %v", err)
	}
	if err := cardUC.Update(cardId, &cardEntities.UpdateCard{NumberOfJudges: ptrInt(numJudges)}); err != nil {
		log.Fatalf("set numberOfJudges: %v", err)
	}
	log.Printf("card id=%d (%q)", cardId, cardName)

	existingBouts, err := boutUC.List(cardId)
	if err != nil {
		log.Fatalf("list bouts: %v", err)
	}
	if len(existingBouts) > 0 {
		log.Printf("clearing %d existing bouts", len(existingBouts))
		for _, b := range existingBouts {
			if err := boutUC.Delete(cardId, b.ID); err != nil {
				log.Fatalf("delete bout %d: %v", b.ID, err)
			}
		}
	}

	for i := 1; i <= totalBouts; i++ {
		b := &boutEntities.Bout{
			CardID:         cardId,
			BoutNumber:     i,
			Gender:         boutEntities.Male,
			AgeCategory:    boutEntities.Elite,
			Experience:     boutEntities.Open,
			RoundLength:    boutEntities.TwoMinutes,
			GloveSize:      boutEntities.TwelveOz,
			BoutType:       boutEntities.BoutTypeScored,
			NumberOfJudges: numJudges,
			Status:         boutEntities.BoutStatusNotStarted,
		}
		if err := boutUC.Create(cardId, b); err != nil {
			log.Fatalf("create bout %d: %v", i, err)
		}
	}

	created, err := boutUC.List(cardId)
	if err != nil {
		log.Fatalf("list bouts after create: %v", err)
	}

	judges := []struct {
		role string
		name string
		good bool // picks panel winner when true
	}{
		{rbac.Judge1, "Alice Consistent", true},
		{rbac.Judge2, "Bob Inconsistent", false},
		{rbac.Judge3, "Carol Consistent", true},
	}

	for _, b := range created {
		panelRed := b.BoutNumber%2 == 1 // alternate panel winners across bouts
		for _, j := range judges {
			pickRed := panelRed
			if !j.good {
				pickRed = !panelRed
			}
			red, blue := 10, 9
			if !pickRed {
				red, blue = 9, 10
			}
			for rn := 1; rn <= 3; rn++ {
				if err := scoreUC.Ready(cardId, b.ID, rn, j.role, j.name); err != nil {
					log.Fatalf("ready %d r%d %s: %v", b.ID, rn, j.role, err)
				}
				if err := scoreUC.Score(cardId, b.ID, rn, j.role, red, blue); err != nil {
					log.Fatalf("score %d r%d %s: %v", b.ID, rn, j.role, err)
				}
				if err := scoreUC.Complete(cardId, b.ID, rn, j.role); err != nil {
					log.Fatalf("complete %d r%d %s: %v", b.ID, rn, j.role, err)
				}
			}
			winner := "red"
			if !pickRed {
				winner = "blue"
			}
			if err := scoreUC.SetOverallWinner(cardId, b.ID, j.role, winner); err != nil {
				log.Fatalf("overall %d %s: %v", b.ID, j.role, err)
			}
		}
		// Admin decision matches the panel.
		decisionWinner := "red"
		if !panelRed {
			decisionWinner = "blue"
		}
		if err := boutUC.MakeDecision(cardId, b.ID, decisionWinner, "unanimous", ""); err != nil {
			log.Fatalf("make decision bout %d: %v", b.ID, err)
		}
		if err := boutUC.Complete(cardId, b.ID); err != nil {
			log.Fatalf("complete bout %d: %v", b.ID, err)
		}
	}

	fmt.Println(strings.Repeat("-", 50))
	fmt.Printf("seeded card %q (id=%d) with %d bouts and %d judges\n", cardName, cardId, totalBouts, numJudges)
	fmt.Println("expected report:")
	fmt.Println("  Alice Consistent  → 100% round/overall agreement")
	fmt.Println("  Carol Consistent  → 100% round/overall agreement")
	fmt.Println("  Bob Inconsistent  →   0% round/overall agreement")
}

func ptrInt(v int) *int { return &v }
