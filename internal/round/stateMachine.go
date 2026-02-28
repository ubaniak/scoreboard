package round

import "github.com/ubaniak/scoreboard/internal/round/entities"

func nextState(rounds []*entities.RoundDetails) int {
	var currActiveRoundIndex int = -1
	for i, round := range rounds {
		if round.Status == entities.RoundStatusNotStarted {
			continue
		}
		if round.Status == entities.RoundStatusComplete {
			continue
		}
		currActiveRoundIndex = i
		break
	}

	if currActiveRoundIndex < 0 {
		return currActiveRoundIndex
	}

	rounds[currActiveRoundIndex].Next()

	if rounds[currActiveRoundIndex].Status == entities.RoundStatusComplete && currActiveRoundIndex < len(rounds)-1 {
		rounds[currActiveRoundIndex+1].Status = entities.RoundStatusInProgress
		return currActiveRoundIndex + 1
	}
	return currActiveRoundIndex
}
