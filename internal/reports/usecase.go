package reports

import (
	"sort"

	athleteEntities "github.com/ubaniak/scoreboard/internal/athletes/entities"
	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	cardEntities "github.com/ubaniak/scoreboard/internal/cards/entities"
	scoreEntities "github.com/ubaniak/scoreboard/internal/scores/entities"
)

// External queriers — narrow interfaces to avoid circular imports.

type CardQuerier interface {
	Get(id uint) (*cardEntities.Card, error)
}

type BoutLister interface {
	List(cardId uint) ([]*boutEntities.Bout, error)
}

type AthleteGetter interface {
	Get(id uint) (*athleteEntities.Athlete, error)
}

type ScoreLister interface {
	List(cardId, boutId uint) ([]*scoreEntities.Score, error)
}

type CommentGetter interface {
	Get(entityKind string, entityId uint) ([]Comment, error)
}

type Comment struct {
	Comment string
}

// UseCase builds reports for a card.
type UseCase struct {
	cards    CardQuerier
	bouts    BoutLister
	athletes AthleteGetter
	scores   ScoreLister
	comments CommentGetter
}

func NewUseCase(cards CardQuerier, bouts BoutLister, athletes AthleteGetter, scores ScoreLister, comments CommentGetter) *UseCase {
	return &UseCase{cards: cards, bouts: bouts, athletes: athletes, scores: scores, comments: comments}
}

// --- data models used by renderers ---

type BoutScore struct {
	JudgeRole string
	JudgeName string
	Round     int
	Red       int
	Blue      int
	OverallWinner string
}

type BoutData struct {
	BoutNumber  int
	BoutType    string
	RedName     string
	RedClub     string
	BlueName    string
	BlueClub    string
	Referee     string
	Winner      string
	Decision    string
	WeightClass int
	GloveSize   string
	RoundLength float64
	AgeCategory string
	Experience  string
	Gender      string
	Comments    []string
	Scores      []BoutScore
}

type ReportData struct {
	CardName string
	CardDate string
	Bouts    []BoutData
}

type JudgeConsistencyRow struct {
	JudgeName   string
	BoutsScored int
	Points      float64
	Rating      float64 // 0-100
}

type ConsistencyReport struct {
	CardName string
	Rows     []JudgeConsistencyRow
}

// --- builders ---

func (uc *UseCase) buildReportData(cardId uint) (*ReportData, error) {
	card, err := uc.cards.Get(cardId)
	if err != nil {
		return nil, err
	}

	boutList, err := uc.bouts.List(cardId)
	if err != nil {
		return nil, err
	}

	sort.Slice(boutList, func(i, j int) bool {
		return boutList[i].BoutNumber < boutList[j].BoutNumber
	})

	rd := &ReportData{
		CardName: card.Name,
		CardDate: card.Date,
	}

	for _, b := range boutList {
		bd := BoutData{
			BoutNumber:  b.BoutNumber,
			BoutType:    string(b.BoutType),
			Referee:     b.Referee,
			Winner:      b.Winner,
			Decision:    b.Decision,
			WeightClass: b.WeightClass,
			GloveSize:   string(b.GloveSize),
			RoundLength: float64(b.RoundLength),
			AgeCategory: string(b.AgeCategory),
			Experience:  string(b.Experience),
			Gender:      string(b.Gender),
		}

		if b.RedAthleteID != nil {
			if a, err := uc.athletes.Get(*b.RedAthleteID); err == nil && a != nil {
				bd.RedName = a.Name
				bd.RedClub = a.ClubName
			}
		}
		if b.BlueAthleteID != nil {
			if a, err := uc.athletes.Get(*b.BlueAthleteID); err == nil && a != nil {
				bd.BlueName = a.Name
				bd.BlueClub = a.ClubName
			}
		}

		if uc.comments != nil {
			if cmts, err := uc.comments.Get("bout", b.ID); err == nil {
				for _, c := range cmts {
					bd.Comments = append(bd.Comments, c.Comment)
				}
			}
		}

		scores, err := uc.scores.List(cardId, b.ID)
		if err == nil {
			for _, s := range scores {
				bd.Scores = append(bd.Scores, BoutScore{
					JudgeRole:     s.JudgeRole,
					JudgeName:     s.JudgeName,
					Round:         s.RoundNumber,
					Red:           s.Red,
					Blue:          s.Blue,
					OverallWinner: s.OverallWinner,
				})
			}
		}

		rd.Bouts = append(rd.Bouts, bd)
	}

	return rd, nil
}

func (uc *UseCase) FullReport(cardId uint) (*ReportData, error) {
	return uc.buildReportData(cardId)
}

func (uc *UseCase) PublicReport(cardId uint) (*ReportData, error) {
	return uc.buildReportData(cardId)
}

func (uc *UseCase) ConsistencyReport(cardId uint) (*ConsistencyReport, error) {
	rd, err := uc.buildReportData(cardId)
	if err != nil {
		return nil, err
	}

	type judgeStats struct {
		boutsScored int
		points      float64
	}
	stats := map[string]*judgeStats{}

	for _, bout := range rd.Bouts {
		if len(bout.Scores) == 0 {
			continue
		}

		// Group scores by judge role for this bout.
		byRole := map[string][]*BoutScore{}
		for i := range bout.Scores {
			s := &bout.Scores[i]
			byRole[s.JudgeRole] = append(byRole[s.JudgeRole], s)
		}

		// Each role has one or more round entries. Collect OverallWinner per role (from round 3).
		judgeResults := map[string]*judgeResult{}
		for role, entries := range byRole {
			jr := &judgeResult{roundWins: map[int]string{}}
			for _, e := range entries {
				if e.JudgeName != "" {
					jr.name = e.JudgeName
				}
				if e.Round == 3 && e.OverallWinner != "" {
					jr.overallWinner = e.OverallWinner
				}
				if e.Red > e.Blue {
					jr.roundWins[e.Round] = "red"
				} else if e.Blue > e.Red {
					jr.roundWins[e.Round] = "blue"
				} else {
					jr.roundWins[e.Round] = "tie"
				}
			}
			judgeResults[role] = jr
		}

		if len(judgeResults) < 2 {
			// Need at least 2 judges for consistency to mean anything.
			continue
		}

		// Majority overall winner.
		winnerCount := map[string]int{}
		for _, jr := range judgeResults {
			if jr.overallWinner != "" {
				winnerCount[jr.overallWinner]++
			}
		}
		majorityWinner := majorityKey(winnerCount)

		// Majority per round.
		rounds := collectRounds(judgeResults)
		majorityRound := map[int]string{}
		for _, r := range rounds {
			rc := map[string]int{}
			for _, jr := range judgeResults {
				rc[jr.roundWins[r]]++
			}
			majorityRound[r] = majorityKey(rc)
		}

		for _, jr := range judgeResults {
			if jr.name == "" {
				continue
			}
			if _, ok := stats[jr.name]; !ok {
				stats[jr.name] = &judgeStats{}
			}
			st := stats[jr.name]
			st.boutsScored++

			// Point 1: picked the overall winner correctly.
			if majorityWinner != "" && jr.overallWinner == majorityWinner {
				st.points++
			}

			// Point 2: round-by-round consistency.
			if len(rounds) > 0 {
				agreed := 0
				for _, r := range rounds {
					if majorityRound[r] != "" && jr.roundWins[r] == majorityRound[r] {
						agreed++
					}
				}
				st.points += float64(agreed) / float64(len(rounds))
			}
		}
	}

	result := &ConsistencyReport{CardName: rd.CardName}
	for name, st := range stats {
		var rating float64
		possible := float64(st.boutsScored) * 2
		if possible > 0 {
			rating = st.points / possible * 100
		}
		result.Rows = append(result.Rows, JudgeConsistencyRow{
			JudgeName:   name,
			BoutsScored: st.boutsScored,
			Points:      st.points,
			Rating:      rating,
		})
	}
	sort.Slice(result.Rows, func(i, j int) bool {
		return result.Rows[i].Rating > result.Rows[j].Rating
	})

	return result, nil
}

type judgeResult struct {
	name          string
	overallWinner string
	roundWins     map[int]string // round -> "red"/"blue"/"tie"
}

func majorityKey(counts map[string]int) string {
	best, bestCount := "", 0
	for k, v := range counts {
		if v > bestCount {
			best, bestCount = k, v
		}
	}
	return best
}

func collectRounds(judgeResults map[string]*judgeResult) []int {
	roundSet := map[int]struct{}{}
	for _, jr := range judgeResults {
		for r := range jr.roundWins {
			roundSet[r] = struct{}{}
		}
	}
	var rounds []int
	for r := range roundSet {
		rounds = append(rounds, r)
	}
	sort.Ints(rounds)
	return rounds
}

