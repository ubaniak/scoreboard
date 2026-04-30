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

type UseCase interface {
	FullReport(cardId uint) (*ReportData, error)
	PublicReport(cardId uint) (*ReportData, error)
}

type useCase struct {
	cards    CardQuerier
	bouts    BoutLister
	athletes AthleteGetter
	scores   ScoreLister
	comments CommentGetter
}

func NewUseCase(cards CardQuerier, bouts BoutLister, athletes AthleteGetter, scores ScoreLister, comments CommentGetter) UseCase {
	return &useCase{cards: cards, bouts: bouts, athletes: athletes, scores: scores, comments: comments}
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

// --- builders ---

func (uc *useCase) buildReportData(cardId uint) (*ReportData, error) {
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

func (uc *useCase) FullReport(cardId uint) (*ReportData, error) {
	return uc.buildReportData(cardId)
}

func (uc *useCase) PublicReport(cardId uint) (*ReportData, error) {
	return uc.buildReportData(cardId)
}

