package main

import (
	"embed"
	"io/fs"
	"log"

	"github.com/joho/godotenv"

	"github.com/ubaniak/scoreboard/internal/appserver"
)

//go:embed all:frontend
var webAssets embed.FS
var staticFilePath = "frontend/dist"

const (
	AppTitle   = "Scoreboard"
	AppTooltip = "Scoreboard Application"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	assets, err := fs.Sub(webAssets, staticFilePath)
	if err != nil {
		panic(err)
	}

	srv, err := appserver.Start(appserver.Config{Assets: assets})
	if err != nil {
		panic(err)
	}

	runApp(srv.HTTPServer, srv.DeviceUseCase, srv.SeedDemo)
}
