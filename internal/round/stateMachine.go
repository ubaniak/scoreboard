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

		// Finishing a round (not the last one) skips the "complete" stop —
		// go straight into the next round instead of waiting for another click.
		justCompleted := rounds[currActiveRoundIndex].Status == entities.RoundStatusComplete
		nextIndex := currActiveRoundIndex + 1
		if justCompleted && nextIndex < len(rounds) && rounds[nextIndex].Status == entities.RoundStatusNotStarted {
			rounds[nextIndex].Status = entities.RoundStatusInProgress
			return nextIndex
		}

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
