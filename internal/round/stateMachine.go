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

	if currActiveRoundIndex >= 0 {
		rounds[currActiveRoundIndex].Next()
		return currActiveRoundIndex
	}

	// No active round — start the next not_started round at in_progress (rest period is over)
	for i, round := range rounds {
		if round.Status == entities.RoundStatusNotStarted {
			rounds[i].Status = entities.RoundStatusInProgress
			return i
		}
	}

	return -1
}
