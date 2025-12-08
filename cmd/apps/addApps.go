package apps

import (
	"github.com/gorilla/mux"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/app"
	"github.com/ubaniak/scoreboard/internal/apps/healthcheck"
	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

func AddApps(router *mux.Router) error {
	db, err := gorm.Open(sqlite.Open("scoreboard.db"), &gorm.Config{})
	if err != nil {
		return err
	}

	authStorage, err := auth.NewAuthStorage(db)
	if err != nil {
		return err
	}

	authUseCase := auth.NewUseCase(authStorage, "my_secret_sign_key")

	roles := rbac.NewRole()
	roles.AddRole("admin")
	roles.AddRole("judge")
	roles.Inherits("admin", "judge")

	rbacSrv := rbac.NewRbacService(roles, authUseCase)

	rb := rbac.NewRouteBuilder(router, rbacSrv)

	apiRegister := app.NewRegister()

	healthCheckApp := healthcheck.NewHealthCheck()
	apiRegister.Add(healthCheckApp)

	// cardStorage, err := cards.NewCardStorage(db)
	// if err != nil {
	// 	return err
	// }
	// cardUseCase := cards.NewUseCase(cardStorage)
	// cardApp := cards.NewApp(cardUseCase)
	// apiRegister.Add(cardApp)
	apiRegister.Register(rb)

	return nil
}
