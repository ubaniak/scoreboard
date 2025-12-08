package utils

import (
	"golang.design/x/clipboard"

	"github.com/ubaniak/scoreboard/internal/devices"
)

func RegisterAdmin(useCase devices.UseCase) {
	val, err := useCase.RegisterAdmin()

	if err != nil {
		panic(err)
	}
	clipboard.Write(clipboard.FmtText, []byte(val))
}
