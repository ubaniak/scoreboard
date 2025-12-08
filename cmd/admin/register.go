package utils

import (
	"golang.design/x/clipboard"

	"github.com/ubaniak/scoreboard/internal/auth"
)

func RegisterAdmin(authUseCase auth.UseCase) {
	val, err := authUseCase.SetAdmin()

	if err != nil {
		panic(err)
	}
	clipboard.Write(clipboard.FmtText, []byte(val))
}
