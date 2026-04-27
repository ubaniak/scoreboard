//go:build !darwin

package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/ubaniak/scoreboard/internal/devices"
)

func runApp(srv *http.Server, deviceUseCase devices.UseCase) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
	log.Println("Shutdown signal received")
	if err := srv.Close(); err != nil {
		log.Printf("Server close error: %v", err)
	}
}
