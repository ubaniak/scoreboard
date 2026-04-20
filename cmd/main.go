package main

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/getlantern/systray"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/pkg/browser"
	"github.com/rs/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	utils "github.com/ubaniak/scoreboard/cmd/admin"
	"github.com/ubaniak/scoreboard/internal/app"
	"github.com/ubaniak/scoreboard/internal/apps/healthcheck"
	"github.com/ubaniak/scoreboard/internal/athletes"
	"github.com/ubaniak/scoreboard/internal/auditlogs"
	auditStorage "github.com/ubaniak/scoreboard/internal/auditlogs/storage"
	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards"
	"github.com/ubaniak/scoreboard/internal/clubs"
	"github.com/ubaniak/scoreboard/internal/comment"
	"github.com/ubaniak/scoreboard/internal/current"
	currentEntities "github.com/ubaniak/scoreboard/internal/current/entities"
	"github.com/ubaniak/scoreboard/internal/datadir"
	"github.com/ubaniak/scoreboard/internal/devices"
	"github.com/ubaniak/scoreboard/internal/events"
	"github.com/ubaniak/scoreboard/internal/login"
	"github.com/ubaniak/scoreboard/internal/officials"
	"github.com/ubaniak/scoreboard/internal/rbac"
	reportsPackage "github.com/ubaniak/scoreboard/internal/reports"
	"github.com/ubaniak/scoreboard/internal/round"
	"github.com/ubaniak/scoreboard/internal/scores"
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

	dbPath, err := datadir.DBPath()
	if err != nil {
		panic(err)
	}
	uploadsDir, err := datadir.UploadsDir()
	if err != nil {
		panic(err)
	}

	r := mux.NewRouter()

	apiRouter := r.PathPrefix("/api").Subrouter()
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	db.Logger = logger.Default.LogMode(logger.Silent)

	authStorage, err := auth.NewAuthStorage(db)
	if err != nil {
		panic(err)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		panic("JWT_SECRET environment variable is not set")
	}
	authUseCase := auth.NewUseCase(authStorage, jwtSecret)

	roles := rbac.NewRole()
	roles.AddRole(rbac.Admin)
	roles.AddRole(rbac.Judge)
	for _, judge := range rbac.JudgeList {
		roles.AddRole(judge)
	}
	roles.Inherits(rbac.Admin, rbac.JudgeList...)

	rbacSrv := rbac.NewRbacService(roles, authUseCase)

	apiRegister := app.NewRegister()
	rb := rbac.NewRouteBuilder(apiRouter, rbacSrv)

	healthCheckApp := healthcheck.NewHealthCheck()
	// -- login
	loginApp := login.NewApp(authUseCase)

	// -- comments

	commentStorage, err := comment.NewSqlite(db)
	if err != nil {
		panic(err)
	}
	commentsUseCase := comment.NewUseCase(commentStorage)

	// -- devices
	deviceUseCase := devices.NewUseCase(authUseCase)
	deviceApp := devices.NewApp(deviceUseCase)
	// -- officials

	officialStorage, err := officials.NewSqlite(db)
	if err != nil {
		panic(err)
	}

	officialUsecCase := officials.NewUseCase(officialStorage)
	officialApp := officials.NewApp(officialUsecCase)

	// -- scores

	scoreStorage, err := scores.NewSqlite(db)
	if err != nil {
		panic(err)
	}

	scoreUseCase := scores.NewUseCase(scoreStorage)

	// -- rounds

	roundStorage, err := round.NewStorage(db)
	if err != nil {
		panic(err)
	}
	roundUseCase := round.NewUseCase(roundStorage)

	// -- cards
	cardStorage, err := cards.NewCardStorage(db)
	if err != nil {
		panic(err)
	}
	cardUseCase := cards.NewUseCase(cardStorage)

	// -- clubs
	clubStorage, err := clubs.NewSqlite(db)
	if err != nil {
		panic(err)
	}
	clubUseCase := clubs.NewUseCase(clubStorage)
	clubApp := clubs.NewApp(clubUseCase)

	// -- athletes
	athleteStorage, err := athletes.NewSqlite(db)
	if err != nil {
		panic(err)
	}
	athleteUseCase := athletes.NewUseCase(athleteStorage)
	athleteApp := athletes.NewApp(athleteUseCase)

	// -- bouts

	boutStorage, err := bouts.NewSqlite(db)
	if err != nil {
		panic(err)
	}

	broadcaster := events.NewBroadcaster()

	boutsUseCase := bouts.NewUseCase(boutStorage, roundUseCase, commentsUseCase, scoreUseCase)
	athleteQuerier := &athleteClubQuerier{athleteUseCase}
	// -- audit logs
	auditLogStorage, err := auditStorage.NewSqlite(db)
	if err != nil {
		panic(err)
	}
	auditLogUseCase := auditlogs.NewUseCase(auditLogStorage)
	auditLogApp := auditlogs.NewApp(auditLogUseCase)

	boutsApp := bouts.NewApp(boutsUseCase, roundUseCase, scoreUseCase, broadcaster, &cardJudgeQuerier{cardUseCase}, athleteQuerier, auditLogUseCase)
	boutsApp.WithAthleteFinderCreator(athleteUseCase)

	// -- reports
	reportsUseCase := reportsPackage.NewUseCase(cardUseCase, boutsUseCase, athleteUseCase, scoreUseCase, &commentQuerier{commentsUseCase})
	reportsApp := reportsPackage.NewApp(reportsUseCase)

	cardApp := cards.NewApp(cardUseCase, boutsApp, reportsApp, broadcaster)

	// -- current
	currentUseCase := current.NewUseCase(cardUseCase, boutsUseCase, scoreUseCase, athleteQuerier, roundUseCase, &officialAffiliationQuerier{officialUsecCase})
	currentApp := current.NewApp(currentUseCase, broadcaster)

	apiRegister.Add(currentApp)
	apiRegister.Add(healthCheckApp)
	apiRegister.Add(loginApp)
	apiRegister.Add(cardApp)
	apiRegister.Add(deviceApp)
	apiRegister.Add(clubApp)
	apiRegister.Add(athleteApp)
	apiRegister.Add(officialApp)
	apiRegister.Add(auditLogApp)

	apiRegister.Register(rb)

	allowedOrigins := []string{
		"http://localhost:8080",
		"http://localhost:5173",
		"http://localhost:4173",
	}
	if origins := os.Getenv("CORS_ORIGINS"); origins != "" {
		allowedOrigins = strings.Split(origins, ",")
	}

	srv := startServer(r, allowedOrigins, uploadsDir)

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

func startServer(r *mux.Router, allowedOrigins []string, uploadsDir string) *http.Server {
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	})

	staticFS, err := fs.Sub(webAssets, staticFilePath)
	if err != nil {
		log.Fatal(err)
	}

	// Helper to serve index.html
	serveIndex := func(w http.ResponseWriter, r *http.Request, staticFS fs.FS) {
		index, err := staticFS.Open("index.html")
		if err != nil {
			http.Error(w, "index.html not found", http.StatusNotFound)
			return
		}
		defer index.Close()

		fi, err := index.Stat()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Set content type explicitly for safety
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeContent(w, r, "index.html", fi.ModTime(), index.(io.ReadSeeker))
	}

	// Custom handler for SPA
	spaHandler := func(w http.ResponseWriter, r *http.Request) {
		// Clean path without leading slash
		cleanPath := strings.TrimPrefix(r.URL.Path, "/")
		if cleanPath == "" {
			cleanPath = "index.html" // Directly serve index for root
		}

		// Log for debugging
		fmt.Printf("Requested URL: %s, Clean path: %s\n", r.URL.Path, cleanPath)

		// Check if path exists
		f, err := staticFS.Open(cleanPath)
		if err != nil {
			if os.IsNotExist(err) || errors.Is(err, fs.ErrInvalid) {
				fmt.Println("Fallback to index.html (not exist or invalid)")
				serveIndex(w, r, staticFS)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer f.Close()

		fi, err := f.Stat()
		if err != nil {
			fmt.Println("Fallback to index.html (stat error)")
			serveIndex(w, r, staticFS)
			return
		}

		if fi.IsDir() {
			fmt.Println("Fallback to index.html (directory)")
			serveIndex(w, r, staticFS)
			return
		}

		// Serve the file normally if it's a file
		fmt.Println("Serving file normally")
		http.FileServer(http.FS(staticFS)).ServeHTTP(w, r)
	}

	// Serve uploaded images from disk
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	// Use the custom handler for all non-API paths
	r.PathPrefix("/").Handler(http.HandlerFunc(spaHandler))

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}
	srv.Handler = corsHandler.Handler(srv.Handler)

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

type cardJudgeQuerier struct {
	uc cards.UseCase
}

func (q *cardJudgeQuerier) GetNumberOfJudges(cardId uint) (int, error) {
	card, err := q.uc.Get(cardId)
	if err != nil {
		return 5, err
	}
	return card.NumberOfJudges, nil
}

type athleteClubQuerier struct {
	uc athletes.UseCase
}

func (q *athleteClubQuerier) GetAthleteInfo(athleteID uint) (clubName, athleteImageUrl, clubImageUrl, provinceName, provinceImageUrl, nationName, nationImageUrl string) {
	a, err := q.uc.Get(athleteID)
	if err != nil || a == nil {
		return "", "", "", "", "", "", ""
	}
	return a.ClubName, a.ImageUrl, a.ClubImageUrl, a.ProvinceName, a.ProvinceImageUrl, a.NationName, a.NationImageUrl
}

func (q *athleteClubQuerier) GetAthleteName(athleteID uint) string {
	a, err := q.uc.Get(athleteID)
	if err != nil || a == nil {
		return ""
	}
	return a.Name
}

type officialAffiliationQuerier struct {
	uc officials.UseCase
}

func (q *officialAffiliationQuerier) GetAffiliations() ([]currentEntities.OfficialAffiliation, error) {
	list, err := q.uc.GetAffiliations()
	if err != nil {
		return nil, err
	}
	result := make([]currentEntities.OfficialAffiliation, len(list))
	for i, o := range list {
		result[i] = currentEntities.OfficialAffiliation{
			Province: o.Province,
			Nation:   o.Nation,
		}
	}
	return result, nil
}

type commentQuerier struct {
	uc comment.UseCase
}

func (q *commentQuerier) Get(entityKind string, entityId uint) ([]reportsPackage.Comment, error) {
	entries, err := q.uc.Get(entityKind, entityId)
	if err != nil {
		return nil, err
	}
	result := make([]reportsPackage.Comment, len(entries))
	for i, e := range entries {
		result[i] = reportsPackage.Comment{Comment: e.Comment}
	}
	return result, nil
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
