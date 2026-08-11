// Package seed creates a card populated with randomized bouts, athletes,
// clubs, and officials, for demoing or exercising the UI with realistic data.
package seed

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/ubaniak/scoreboard/internal/affiliations"
	"github.com/ubaniak/scoreboard/internal/athletes"
	"github.com/ubaniak/scoreboard/internal/bouts"
	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/cards"
	cardEntities "github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/officials"
	officialEntities "github.com/ubaniak/scoreboard/internal/officials/entities"
	"github.com/ubaniak/scoreboard/internal/rbac"
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

var clubNames = []string{
	"Iron Fist BC", "Northside Boxing", "Crescent Gym", "Riverside Athletic",
	"Hilltop Boxing Club", "Old Town BC", "Eastside Boxing", "Westgate Gym",
	"Phoenix Boxing", "Apex Athletics", "Lighthouse BC", "Summit Boxing",
}

var nationalities = []string{
	"USA", "GBR", "IRL", "CAN", "AUS", "GER", "FRA", "ESP", "ITA", "POL",
}

// MaxClubs is the number of distinct clubs available in the built-in pool.
var MaxClubs = len(clubNames)

// Options controls how a demo card is generated.
type Options struct {
	CardName   string
	Date       string // YYYY-MM-DD, defaults to today if empty
	Bouts      int
	Judges     int    // 1..5
	Done       int    // number of bouts (in order) to fully score + complete
	Clubs      int    // number of clubs, drawn from the built-in pool (1..MaxClubs)
	Officials  int    // number of officials to register
	Clear      bool   // delete existing bouts on the card before seeding
	Activate   bool   // set card status to in_progress
	NoAthletes bool   // skip creating athletes, leaves bout corners empty
	RNGSeed    int64  // 0 = time-based
}

// Deps are the domain usecases seeding writes through.
type Deps struct {
	Cards        cards.UseCase
	Bouts        bouts.UseCase
	Athletes     athletes.UseCase
	Affiliations affiliations.UseCase
	Officials    officials.UseCase
	Scores       scores.UseCase
}

// Result summarizes what was created, for logging/display.
type Result struct {
	CardID    uint
	Bouts     int
	Scored    int
	Judges    int
	Officials int
}

func (r Result) String() string {
	return fmt.Sprintf("seeded card (id=%d) with %d bouts (%d scored+completed), %d judges, %d officials",
		r.CardID, r.Bouts, r.Scored, r.Judges, r.Officials)
}

func randomName(rng *rand.Rand) string {
	return firstNames[rng.Intn(len(firstNames))] + " " + lastNames[rng.Intn(len(lastNames))]
}

func randomClub(rng *rand.Rand, pool []uint) uint {
	return pool[rng.Intn(len(pool))]
}

// Run creates (or reuses) a card and populates it per opts. It is safe to
// call repeatedly with -Clear to reset a demo card's bouts.
func Run(deps Deps, opts Options) (Result, error) {
	if opts.Judges < 1 || opts.Judges > 5 {
		return Result{}, fmt.Errorf("judges must be 1..5 (got %d)", opts.Judges)
	}
	if opts.Bouts < 1 {
		return Result{}, fmt.Errorf("bouts must be >= 1")
	}
	if opts.Clubs < 1 || opts.Clubs > MaxClubs {
		return Result{}, fmt.Errorf("clubs must be 1..%d (got %d)", MaxClubs, opts.Clubs)
	}
	if opts.Done < 0 || opts.Done > opts.Bouts {
		return Result{}, fmt.Errorf("done must be 0..bouts (got %d)", opts.Done)
	}
	date := opts.Date
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	rngSeed := opts.RNGSeed
	if rngSeed == 0 {
		rngSeed = time.Now().UnixNano()
	}
	rng := rand.New(rand.NewSource(rngSeed))

	clubPool := clubNames[:opts.Clubs]
	clubIDs := make([]uint, len(clubPool))
	for i, name := range clubPool {
		id, err := deps.Affiliations.FindOrCreateByName(name)
		if err != nil {
			return Result{}, fmt.Errorf("create club affiliation %q: %w", name, err)
		}
		clubIDs[i] = id
	}

	cardID, err := deps.Cards.FindOrCreateByName(opts.CardName, date)
	if err != nil {
		return Result{}, fmt.Errorf("find/create card: %w", err)
	}

	cardUpdate := &cardEntities.UpdateCard{NumberOfJudges: &opts.Judges}
	if opts.Activate {
		s := string(cardEntities.CardStatusInProgress)
		cardUpdate.Status = &s
	}
	if err := deps.Cards.Update(cardID, cardUpdate); err != nil {
		return Result{}, fmt.Errorf("update card: %w", err)
	}

	if opts.Clear {
		existing, err := deps.Bouts.List(cardID)
		if err != nil {
			return Result{}, fmt.Errorf("list bouts: %w", err)
		}
		for _, b := range existing {
			if err := deps.Bouts.Delete(cardID, b.ID); err != nil {
				return Result{}, fmt.Errorf("delete bout %d: %w", b.ID, err)
			}
		}
	}

	for i := 1; i <= opts.Bouts; i++ {
		b := &boutEntities.Bout{
			CardID:         cardID,
			BoutNumber:     i,
			Gender:         boutEntities.Male,
			AgeCategory:    boutEntities.Elite,
			Experience:     boutEntities.Open,
			RoundLength:    boutEntities.TwoMinutes,
			GloveSize:      boutEntities.TwelveOz,
			BoutType:       boutEntities.BoutTypeScored,
			NumberOfJudges: opts.Judges,
			Status:         boutEntities.BoutStatusNotStarted,
			WeightClass:    70,
		}
		if !opts.NoAthletes {
			redClub := randomClub(rng, clubIDs)
			redID, err := deps.Athletes.FindOrCreateByNameAndClub(randomName(rng), &redClub)
			if err != nil {
				return Result{}, fmt.Errorf("create red athlete for bout %d: %w", i, err)
			}
			blueClub := randomClub(rng, clubIDs)
			blueID, err := deps.Athletes.FindOrCreateByNameAndClub(randomName(rng), &blueClub)
			if err != nil {
				return Result{}, fmt.Errorf("create blue athlete for bout %d: %w", i, err)
			}
			b.RedAthleteID = &redID
			b.BlueAthleteID = &blueID
		}
		if _, err := deps.Bouts.Create(cardID, b); err != nil {
			return Result{}, fmt.Errorf("create bout %d: %w", i, err)
		}
	}

	for i := 1; i <= opts.Officials; i++ {
		o := &officialEntities.Official{
			Name:               randomName(rng),
			Nationality:        nationalities[rng.Intn(len(nationalities))],
			Gender:             []string{"M", "F"}[rng.Intn(2)],
			YearOfBirth:        1960 + rng.Intn(45),
			RegistrationNumber: fmt.Sprintf("REG-%04d", 1000+i),
		}
		if err := deps.Officials.Create(o); err != nil {
			return Result{}, fmt.Errorf("create official %d: %w", i, err)
		}
	}

	result := Result{CardID: cardID, Bouts: opts.Bouts, Judges: opts.Judges, Officials: opts.Officials}
	if opts.Done == 0 {
		return result, nil
	}

	// Fully score + complete the first Done bouts (in bout-number order) so
	// reports/UI have a realistic mix of completed and not-started bouts.
	roles := rbac.JudgeList[:opts.Judges]
	created, err := deps.Bouts.List(cardID)
	if err != nil {
		return Result{}, fmt.Errorf("list bouts after create: %w", err)
	}
	if opts.Done < len(created) {
		created = created[:opts.Done]
	}
	for _, b := range created {
		// Pick a panel winner once, then have judges agree.
		panelRed := rng.Intn(2) == 0
		for rn := 1; rn <= 3; rn++ {
			for _, role := range roles {
				name := fmt.Sprintf("Judge %s", strings.TrimPrefix(role, "judge"))
				if err := deps.Scores.Ready(cardID, b.ID, rn, role, name); err != nil {
					return Result{}, fmt.Errorf("ready bout=%d r=%d %s: %w", b.ID, rn, role, err)
				}
				red, blue := 10, 9
				if !panelRed {
					red, blue = 9, 10
				}
				if err := deps.Scores.Score(cardID, b.ID, rn, role, red, blue); err != nil {
					return Result{}, fmt.Errorf("score bout=%d r=%d %s: %w", b.ID, rn, role, err)
				}
				if err := deps.Scores.Complete(cardID, b.ID, rn, role); err != nil {
					return Result{}, fmt.Errorf("complete bout=%d r=%d %s: %w", b.ID, rn, role, err)
				}
			}
		}
		winner := "red"
		if !panelRed {
			winner = "blue"
		}
		for _, role := range roles {
			if err := deps.Scores.SetOverallWinner(cardID, b.ID, role, winner); err != nil {
				return Result{}, fmt.Errorf("overall bout=%d %s: %w", b.ID, role, err)
			}
		}
		if err := deps.Bouts.MakeDecision(cardID, b.ID, winner, "unanimous", ""); err != nil {
			return Result{}, fmt.Errorf("make decision bout=%d: %w", b.ID, err)
		}
		if err := deps.Bouts.Complete(cardID, b.ID); err != nil {
			return Result{}, fmt.Errorf("complete bout=%d: %w", b.ID, err)
		}
	}
	result.Scored = len(created)

	return result, nil
}
