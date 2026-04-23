package reports

import (
	"math"
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
	JudgeRole     string
	JudgeName     string
	Round         int
	Red           int
	Blue          int
	OverallWinner string
}

type BoutData struct {
	BoutNumber   int
	BoutType     string
	Status       string
	RedName      string
	RedClub      string
	BlueName     string
	BlueClub     string
	Referee      string
	Winner       string
	Decision     string
	WeightClass  int
	GloveSize    string
	RoundLength  float64
	NumberOfRounds int
	AgeCategory  string
	Experience   string
	Gender       string
	Comments     []string
	Scores       []BoutScore
}

type ReportData struct {
	CardName string
	CardDate string
	Bouts    []BoutData
}

type JudgeConsistencyRow struct {
	JudgeName    string
	TotalRed     int
	TotalBlue    int
	AvgDeviation float64
	AgreementPct float64
}

type ConsistencyReport struct {
	CardName string
	CardDate string
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
			Status:      string(b.Status),
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
			maxRound := 0
			for _, s := range scores {
				bd.Scores = append(bd.Scores, BoutScore{
					JudgeRole:     s.JudgeRole,
					JudgeName:     s.JudgeName,
					Round:         s.RoundNumber,
					Red:           s.Red,
					Blue:          s.Blue,
					OverallWinner: s.OverallWinner,
				})
				if s.RoundNumber > maxRound {
					maxRound = s.RoundNumber
				}
			}
			bd.NumberOfRounds = maxRound
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

	type judgeStat struct {
		totalRed   int
		totalBlue  int
		deviations []float64
		agreed     int
		total      int
	}
	stats := map[string]*judgeStat{}

	for _, bout := range rd.Bouts {
		// Group scores by round
		byRound := map[int][]BoutScore{}
		for _, s := range bout.Scores {
			byRound[s.Round] = append(byRound[s.Round], s)
		}

		for _, roundScores := range byRound {
			if len(roundScores) == 0 {
				continue
			}

			// Mean scores across all judges this round
			var sumRed, sumBlue float64
			for _, s := range roundScores {
				sumRed += float64(s.Red)
				sumBlue += float64(s.Blue)
			}
			n := float64(len(roundScores))
			meanRed := sumRed / n
			meanBlue := sumBlue / n

			// Majority winner this round
			redWins, blueWins := 0, 0
			for _, s := range roundScores {
				if s.Red > s.Blue {
					redWins++
				} else if s.Blue > s.Red {
					blueWins++
				}
			}
			var majority string
			if redWins > blueWins {
				majority = "red"
			} else if blueWins > redWins {
				majority = "blue"
			} else {
				majority = "draw"
			}

			for _, s := range roundScores {
				name := s.JudgeName
				if name == "" {
					name = s.JudgeRole
				}
				if _, ok := stats[name]; !ok {
					stats[name] = &judgeStat{}
				}
				st := stats[name]
				st.totalRed += s.Red
				st.totalBlue += s.Blue
				dev := math.Abs(float64(s.Red)-meanRed) + math.Abs(float64(s.Blue)-meanBlue)
				st.deviations = append(st.deviations, dev)
				st.total++

				var judgeWinner string
				if s.Red > s.Blue {
					judgeWinner = "red"
				} else if s.Blue > s.Red {
					judgeWinner = "blue"
				} else {
					judgeWinner = "draw"
				}
				if judgeWinner == majority {
					st.agreed++
				}
			}
		}
	}

	result := &ConsistencyReport{CardName: rd.CardName, CardDate: rd.CardDate}
	for name, st := range stats {
		avgDev := 0.0
		if len(st.deviations) > 0 {
			sum := 0.0
			for _, d := range st.deviations {
				sum += d
			}
			avgDev = sum / float64(len(st.deviations))
		}
		agreePct := 0.0
		if st.total > 0 {
			agreePct = float64(st.agreed) / float64(st.total) * 100
		}
		result.Rows = append(result.Rows, JudgeConsistencyRow{
			JudgeName:    name,
			TotalRed:     st.totalRed,
			TotalBlue:    st.totalBlue,
			AvgDeviation: avgDev,
			AgreementPct: agreePct,
		})
	}
	sort.Slice(result.Rows, func(i, j int) bool {
		return result.Rows[i].AgreementPct > result.Rows[j].AgreementPct
	})

	return result, nil
}
