package current

import (
	"errors"

	"github.com/ubaniak/scoreboard/internal/bouts"
	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/current/entities"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
	sberrs "github.com/ubaniak/scoreboard/internal/sbErrs"
	"github.com/ubaniak/scoreboard/internal/scores"
)

type UseCase interface {
	Current() (*entities.Current, error)
	CurrentForAnnouncer() (*entities.Current, error)
	List() (*entities.BoutList, error)
}

// AthleteQuerier is a narrow interface to look up athlete info without
// importing the full athletes package (avoids circular dependencies).
type AthleteQuerier interface {
	GetAthleteInfo(athleteID uint) (clubName, athleteImageUrl, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl string)
	GetAthleteName(athleteID uint) string
}

// RoundDetailsQuerier fetches foul/warning details for a single round.
type RoundDetailsQuerier interface {
	Get(boutId uint, roundNumber int) (*roundEntities.RoundDetails, error)
}

// OfficialQuerier fetches official affiliation info for the scoreboard.
type OfficialQuerier interface {
	GetAffiliations() ([]entities.OfficialAffiliation, error)
}

type usecase struct {
	cards     cards.UseCase
	bouts     bouts.UseCase
	scores    scores.UseCase
	athletes  AthleteQuerier
	rounds    RoundDetailsQuerier
	officials OfficialQuerier
}

func NewUseCase(cardsUseCase cards.UseCase, boutsUseCase bouts.UseCase, scoresUseCase scores.UseCase, athleteQuerier AthleteQuerier, roundQuerier RoundDetailsQuerier, officialQuerier OfficialQuerier) UseCase {
	return &usecase{cards: cardsUseCase, bouts: boutsUseCase, scores: scoresUseCase, athletes: athleteQuerier, rounds: roundQuerier, officials: officialQuerier}
}

func (u *usecase) Current() (*entities.Current, error) {
	return u.buildCurrent(func(b *boutEntities.Bout) bool {
		return string(b.Status) == "show_decision" || string(b.Status) == "completed"
	}, true, false)
}

// CurrentForAnnouncer mirrors Current() but gates winner/decision on a
// separate, admin-triggered flag instead of the public show_decision status —
// so an announcer's reveal is independent of the public Scoreboard's reveal.
// Scores are never included; the announcer page doesn't show live rounds.
// Neighboring bouts are included so the announcer can see what just finished
// and what's coming up next.
func (u *usecase) CurrentForAnnouncer() (*entities.Current, error) {
	return u.buildCurrent(func(b *boutEntities.Bout) bool {
		return b.AnnouncerRevealed
	}, false, true)
}

// buildNeighborBout builds the lightweight bout-preview shape shown for a
// bout that isn't the active one (the next-up or just-finished bout) —
// corner names and basic meta, no scores/decision.
func (u *usecase) buildNeighborBout(b *boutEntities.Bout, athleteAffiliation string) *entities.CurrentBout {
	var redName, blueName, redAff, blueAff, redAffImg, blueAffImg string
	if u.athletes != nil {
		if b.RedAthleteID != nil {
			redName = u.athletes.GetAthleteName(*b.RedAthleteID)
			clubName, _, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl := u.athletes.GetAthleteInfo(*b.RedAthleteID)
			switch athleteAffiliation {
			case "province":
				redAff, redAffImg = provinceName, provinceImageUrl
			case "nation":
				redAff, redAffImg = nationName, nationImageUrl
			default:
				redAff, redAffImg = clubName, clubImageUrl
			}
		}
		if b.BlueAthleteID != nil {
			blueName = u.athletes.GetAthleteName(*b.BlueAthleteID)
			clubName, _, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl := u.athletes.GetAthleteInfo(*b.BlueAthleteID)
			switch athleteAffiliation {
			case "province":
				blueAff, blueAffImg = provinceName, provinceImageUrl
			case "nation":
				blueAff, blueAffImg = nationName, nationImageUrl
			default:
				blueAff, blueAffImg = clubName, clubImageUrl
			}
		}
	}

	return &entities.CurrentBout{
		ID:               b.ID,
		Number:           b.BoutNumber,
		BoutType:         string(b.BoutType),
		RedCorner:        redName,
		BlueCorner:       blueName,
		Gender:           string(b.Gender),
		WeightClass:      b.WeightClass,
		GloveSize:        string(b.GloveSize),
		RoundLength:      int(b.RoundLength),
		AgeCategory:      string(b.AgeCategory),
		Experience:       string(b.Experience),
		Status:           string(b.Status),
		RedClubName:      redAff,
		BlueClubName:     blueAff,
		RedClubImageUrl:  redAffImg,
		BlueClubImageUrl: blueAffImg,
	}
}

func (u *usecase) buildCurrent(reveal func(*boutEntities.Bout) bool, includeScores, includeNeighbors bool) (*entities.Current, error) {
	var current entities.Current

	card, err := u.cards.Current()
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &current, nil
		}
		return nil, err
	}

	affiliation := card.ShowOfficialAffiliation
	if affiliation == "" {
		affiliation = "none"
	}
	athleteAffiliation := card.ShowAthleteAffiliation
	if athleteAffiliation == "" {
		athleteAffiliation = "club"
	}
	currentCard := &entities.CurrentCard{
		ID:                      card.ID,
		Name:                    card.Name,
		ImageUrl:                card.ImageUrl,
		ShowCardImage:           card.ShowCardImage,
		ShowAthleteImages:       card.ShowAthleteImages,
		ShowClubImages:          card.ShowClubImages,
		ShowOfficialAffiliation: affiliation,
	}
	if u.officials != nil {
		officials, err := u.officials.GetAffiliations()
		if err == nil {
			currentCard.Officials = officials
		}
	}
	current.Card = currentCard

	bout, err := u.bouts.Current(card.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			// No active bout — find the next not_started one
			all, listErr := u.bouts.List(card.ID)
			if listErr == nil {
				for i, b := range all {
					if string(b.Status) == "not_started" {
						current.NextBout = u.buildNeighborBout(b, athleteAffiliation)
						if includeNeighbors && i > 0 {
							current.PreviousBout = u.buildNeighborBout(all[i-1], athleteAffiliation)
						}
						break
					}
				}
			}
			return &current, err
		}
		return nil, err
	}

	var redName, blueName, redAffName, blueAffName, redImage, blueImage, redAffImage, blueAffImage string
	if u.athletes != nil {
		if bout.RedAthleteID != nil {
			redName = u.athletes.GetAthleteName(*bout.RedAthleteID)
			clubName, athleteImageUrl, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl := u.athletes.GetAthleteInfo(*bout.RedAthleteID)
			redImage = athleteImageUrl
			switch athleteAffiliation {
			case "province":
				redAffName, redAffImage = provinceName, provinceImageUrl
			case "nation":
				redAffName, redAffImage = nationName, nationImageUrl
			default:
				redAffName, redAffImage = clubName, clubImageUrl
			}
		}
		if bout.BlueAthleteID != nil {
			blueName = u.athletes.GetAthleteName(*bout.BlueAthleteID)
			clubName, athleteImageUrl, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl := u.athletes.GetAthleteInfo(*bout.BlueAthleteID)
			blueImage = athleteImageUrl
			switch athleteAffiliation {
			case "province":
				blueAffName, blueAffImage = provinceName, provinceImageUrl
			case "nation":
				blueAffName, blueAffImage = nationName, nationImageUrl
			default:
				blueAffName, blueAffImage = clubName, clubImageUrl
			}
		}
	}

	decisionRevealed := reveal(bout)

	currentBout := &entities.CurrentBout{
		ID:                  bout.ID,
		Number:              bout.BoutNumber,
		BoutType:            string(bout.BoutType),
		RedCorner:           redName,
		BlueCorner:          blueName,
		Gender:              string(bout.Gender),
		WeightClass:         bout.WeightClass,
		GloveSize:           string(bout.GloveSize),
		RoundLength:         int(bout.RoundLength),
		AgeCategory:         string(bout.AgeCategory),
		Experience:          string(bout.Experience),
		Status:              string(bout.Status),
		RedClubName:         redAffName,
		BlueClubName:        blueAffName,
		RedAthleteImageUrl:  redImage,
		BlueAthleteImageUrl: blueImage,
		RedClubImageUrl:     redAffImage,
		BlueClubImageUrl:    blueAffImage,
	}
	if decisionRevealed {
		currentBout.Decision = bout.Decision
		currentBout.Winner = bout.Winner
	}
	current.Bout = currentBout

	if includeNeighbors {
		all, listErr := u.bouts.List(card.ID)
		if listErr == nil {
			for i, b := range all {
				if b.ID != bout.ID {
					continue
				}
				if i > 0 {
					current.PreviousBout = u.buildNeighborBout(all[i-1], athleteAffiliation)
				}
				if i+1 < len(all) {
					current.NextBout = u.buildNeighborBout(all[i+1], athleteAffiliation)
				}
				break
			}
		}
	}

	boutDecided := current.Bout.Status == "decision_made" || current.Bout.Status == "show_decision" || current.Bout.Status == "completed"
	scoresAllowed := decisionRevealed

	round, err := u.bouts.CurrentRound(bout.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			if !boutDecided {
				return &current, err
			}
			// No active round but bout is decided — fall through to fetch scores
		} else {
			return nil, err
		}
	}

	if round != nil {
		current.Round = &entities.CurrentRound{
			Number: round.RoundNumber,
			Status: string(round.Status),
		}
	}

	if includeScores {
		scores, err := u.scores.List(card.ID, bout.ID)
		if err != nil {
			if errors.Is(err, sberrs.ErrRecordNotFound) {
				return &current, err
			}
			return nil, err
		}
		if len(scores) > 0 && (scoresAllowed || ShouldShowScores(round, bout)) {
			current.Scores = make(map[int][]entities.CurrentScore)
			for _, s := range scores {
				current.Scores[s.RoundNumber] = append(current.Scores[s.RoundNumber], entities.CurrentScore{
					Red:  s.Red,
					Blue: s.Blue,
				})
			}

			// Fetch warning counts for each round that has scores.
			if u.rounds != nil {
				current.Warnings = make(map[int]*entities.CurrentWarnings)
				for roundNum := range current.Scores {
					rd, err := u.rounds.Get(bout.ID, roundNum)
					if err == nil && rd != nil {
						redWarn := len(rd.Red.Warnings)
						blueWarn := len(rd.Blue.Warnings)
						if redWarn > 0 || blueWarn > 0 {
							current.Warnings[roundNum] = &entities.CurrentWarnings{
								Red:  redWarn,
								Blue: blueWarn,
							}
						}
					}
				}
				if len(current.Warnings) == 0 {
					current.Warnings = nil
				}
			}
		}
	}

	return &current, nil
}

func (u *usecase) List() (*entities.BoutList, error) {
	card, err := u.cards.Current()
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return &entities.BoutList{}, nil
		}
		return nil, err
	}

	listAffiliation := card.ShowOfficialAffiliation
	if listAffiliation == "" {
		listAffiliation = "none"
	}
	athleteAffiliation := card.ShowAthleteAffiliation
	if athleteAffiliation == "" {
		athleteAffiliation = "club"
	}
	result := &entities.BoutList{
		Card: &entities.CurrentCard{
			ID:                      card.ID,
			Name:                    card.Name,
			ImageUrl:                card.ImageUrl,
			ShowCardImage:           card.ShowCardImage,
			ShowAthleteImages:       card.ShowAthleteImages,
			ShowClubImages:          card.ShowClubImages,
			ShowOfficialAffiliation: listAffiliation,
		},
	}

	bouts, err := u.bouts.List(card.ID)
	if err != nil {
		if errors.Is(err, sberrs.ErrRecordNotFound) {
			return result, nil
		}
		return nil, err
	}

	for _, b := range bouts {
		decisionRevealed := b.Status == boutEntities.BoutStatusShowDecision || b.Status == boutEntities.BoutStatusCompleted

		var bRedName, bBlueName, redClub, blueClub, redImage, blueImage, redClubImage, blueClubImage string
		if u.athletes != nil {
			if b.RedAthleteID != nil {
				bRedName = u.athletes.GetAthleteName(*b.RedAthleteID)
				clubName, athleteImageUrl, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl := u.athletes.GetAthleteInfo(*b.RedAthleteID)
				redImage = athleteImageUrl
				switch athleteAffiliation {
				case "province":
					redClub, redClubImage = provinceName, provinceImageUrl
				case "nation":
					redClub, redClubImage = nationName, nationImageUrl
				default:
					redClub, redClubImage = clubName, clubImageUrl
				}
			}
			if b.BlueAthleteID != nil {
				bBlueName = u.athletes.GetAthleteName(*b.BlueAthleteID)
				clubName, athleteImageUrl, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl := u.athletes.GetAthleteInfo(*b.BlueAthleteID)
				blueImage = athleteImageUrl
				switch athleteAffiliation {
				case "province":
					blueClub, blueClubImage = provinceName, provinceImageUrl
				case "nation":
					blueClub, blueClubImage = nationName, nationImageUrl
				default:
					blueClub, blueClubImage = clubName, clubImageUrl
				}
			}
		}

		item := entities.BoutListItem{
			ID:                  b.ID,
			Number:              b.BoutNumber,
			BoutType:            string(b.BoutType),
			RedCorner:           bRedName,
			BlueCorner:          bBlueName,
			Status:              string(b.Status),
			WeightClass:         b.WeightClass,
			GloveSize:           string(b.GloveSize),
			RoundLength:         int(b.RoundLength),
			AgeCategory:         string(b.AgeCategory),
			Experience:          string(b.Experience),
			RedClubName:         redClub,
			BlueClubName:        blueClub,
			RedAthleteImageUrl:  redImage,
			BlueAthleteImageUrl: blueImage,
			RedClubImageUrl:     redClubImage,
			BlueClubImageUrl:    blueClubImage,
		}
		if decisionRevealed {
			item.Winner = b.Winner
			item.Decision = b.Decision
		}
		result.Bouts = append(result.Bouts, item)
	}

	return result, nil
}

func ShouldShowScores(round *roundEntities.Round, bout *boutEntities.Bout) bool {
	if round == nil {
		return false
	}

	if round.RoundNumber != 3 && round.Status == roundEntities.RoundStatusScoreComplete {
		return true
	}
	if round.RoundNumber == 3 && bout.Status == boutEntities.BoutStatusShowDecision {
		return true
	}
	return false
}
