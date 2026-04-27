//go:build darwin && cgo

package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/getlantern/systray"
	"github.com/pkg/browser"
	utils "github.com/ubaniak/scoreboard/cmd/admin"
	"github.com/ubaniak/scoreboard/internal/devices"
)

func runApp(srv *http.Server, deviceUseCase devices.UseCase) {
	systray.Run(func() {
		systray.SetTitle(AppTitle)
		systray.SetTooltip(AppTooltip)

		mOpen := systray.AddMenuItem("Open UI", "Open the web interface")
		mAdmin := systray.AddMenuItem("Admin Password", "Set the admin password")
		mQuit := systray.AddMenuItem("Quit", "Exit the app")

		for {
			select {
			case <-mOpen.ClickedCh:
				url := "http://localhost:8080"
				if err := browser.OpenURL(url); err != nil {
					log.Printf("Failed to open browser: %v", err)
				}
			case <-mAdmin.ClickedCh:
				utils.RegisterAdmin(deviceUseCase)
			case <-mQuit.ClickedCh:
				systray.Quit()
				return
			}
		}
	}, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Server forced to shutdown: %v", err)
		}
	})
}
