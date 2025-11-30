package apps

import (
	"github.com/ubaniak/scoreboard/app"
	"github.com/ubaniak/scoreboard/apps/healthcheck"
)

func AddApps(apiRegister *app.Register) error {
	// Register HealthCheck app
	healthCheckApp := healthcheck.NewHealthCheck()
	apiRegister.Add(healthCheckApp)

	// Additional apps can be registered here
	return nil
}
