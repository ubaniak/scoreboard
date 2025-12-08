package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/getlantern/systray"
	"github.com/gorilla/mux"
	"github.com/pkg/browser"
	"github.com/rs/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	utils "github.com/ubaniak/scoreboard/cmd/admin"
	"github.com/ubaniak/scoreboard/internal/app"
	"github.com/ubaniak/scoreboard/internal/apps/healthcheck"
	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/login"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

//go:embed all:frontend
var webAssets embed.FS
var staticFilePath = "frontend/dist"

const (
	AppTitle   = "Scoreboard"
	AppTooltip = "Scoreboard Application"
)

func main() {
	r := mux.NewRouter()

	apiRouter := r.PathPrefix("/api").Subrouter()
	db, err := gorm.Open(sqlite.Open("scoreboard.db"), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	db.Logger = logger.Default.LogMode(logger.Silent)

	authStorage, err := auth.NewAuthStorage(db)
	if err != nil {
		panic(err)
	}

	authUseCase := auth.NewUseCase(authStorage, "my_secret_sign_key")

	roles := rbac.NewRole()
	roles.AddRole("admin")
	roles.AddRole("judge")
	roles.Inherits("admin", "judge")

	rbacSrv := rbac.NewRbacService(roles, authUseCase)

	apiRegister := app.NewRegister()
	rb := rbac.NewRouteBuilder(apiRouter, rbacSrv)

	healthCheckApp := healthcheck.NewHealthCheck()
	loginApp := login.NewApp(authUseCase)

	apiRegister.Add(healthCheckApp)
	apiRegister.Add(loginApp)

	apiRegister.Register(rb)

	srv := startServer(r)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	srv.Handler = corsHandler.Handler(srv.Handler)

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
				utils.RegisterAdmin(authUseCase)
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

func startServer(r *mux.Router) *http.Server {
	staticFS, err := fs.Sub(webAssets, staticFilePath)
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.FS(staticFS))

	r.PathPrefix("/").Handler(fileServer)

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	localIP := getLocalIP()
	log.Printf("Server started on http://0.0.0.0:8080")
	log.Printf("Local access: http://localhost:8080")
	if localIP != "" {
		log.Printf("Network access (from other machines): http://%s:8080", localIP)
	} else {
		log.Printf("Could not detect local IP; ensure firewall allows port 8080")
	}

	return srv
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return ""
}
