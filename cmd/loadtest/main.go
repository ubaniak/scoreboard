package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

var (
	flagBase       = flag.String("base", "http://localhost:8080", "scoreboard server base URL")
	flagBouts      = flag.Int("bouts", 100, "number of bouts to create")
	flagJudges     = flag.Int("judges", 3, "number of judges (1-5)")
	flagRounds     = flag.Int("rounds", 3, "rounds per bout (the app currently creates 3)")
	flagCardName   = flag.String("card", "Load Test Card", "card name")
	flagSkipFlow   = flag.Bool("skip-flow", false, "create card+bouts only, skip scoring flow")
	flagVerbose    = flag.Bool("v", false, "verbose request logging")
	flagSeed       = flag.Int64("seed", 0, "RNG seed (0 = time-based)")
	flagCredsOut   = flag.String("creds-out", "", "write admin+judge credentials JSON to this path")
)

type apiEnvelope struct {
	Data  json.RawMessage `json:"data"`
	Error string          `json:"error"`
}

type client struct {
	base    string
	http    *http.Client
	token   string
	verbose bool
}

func newClient(base string) *client {
	return &client{
		base: base,
		http: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *client) do(method, path string, body any, out any) (time.Duration, error) {
	var reader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return 0, err
		}
		reader = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, c.base+path, reader)
	if err != nil {
		return 0, err
	}
	if reader != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	start := time.Now()
	resp, err := c.http.Do(req)
	dur := time.Since(start)
	if err != nil {
		return dur, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return dur, err
	}
	if c.verbose {
		log.Printf("%s %s -> %d (%.0fms) %s", method, path, resp.StatusCode, float64(dur.Milliseconds()), truncate(string(raw), 160))
	}
	if resp.StatusCode >= 400 {
		return dur, fmt.Errorf("%s %s: %d %s", method, path, resp.StatusCode, truncate(string(raw), 200))
	}
	if out == nil {
		return dur, nil
	}
	var env apiEnvelope
	if err := json.Unmarshal(raw, &env); err != nil {
		// Not all endpoints return enveloped JSON; try direct unmarshal.
		return dur, json.Unmarshal(raw, out)
	}
	if env.Error != "" {
		return dur, fmt.Errorf("%s %s: %s", method, path, env.Error)
	}
	if len(env.Data) == 0 || string(env.Data) == "null" {
		return dur, nil
	}
	return dur, json.Unmarshal(env.Data, out)
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

type latencies struct {
	mu  sync.Mutex
	all []time.Duration
	err int64
}

func (l *latencies) add(d time.Duration, err error) {
	l.mu.Lock()
	l.all = append(l.all, d)
	l.mu.Unlock()
	if err != nil {
		atomic.AddInt64(&l.err, 1)
	}
}

func (l *latencies) summary(label string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(l.all) == 0 {
		fmt.Printf("  %s: no samples\n", label)
		return
	}
	sorted := make([]time.Duration, len(l.all))
	copy(sorted, l.all)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })
	p := func(q float64) time.Duration {
		i := int(float64(len(sorted)-1) * q)
		return sorted[i]
	}
	fmt.Printf("  %-22s n=%d errors=%d p50=%v p95=%v p99=%v max=%v\n",
		label, len(sorted), atomic.LoadInt64(&l.err), p(0.5), p(0.95), p(0.99), sorted[len(sorted)-1])
}

func main() {
	flag.Parse()
	if *flagJudges < 1 || *flagJudges > 5 {
		log.Fatalf("-judges must be 1..5")
	}
	seed := *flagSeed
	if seed == 0 {
		seed = time.Now().UnixNano()
	}
	rng := rand.New(rand.NewSource(seed))
	log.Printf("base=%s bouts=%d judges=%d seed=%d", *flagBase, *flagBouts, *flagJudges, seed)

	admin := newClient(*flagBase)
	admin.verbose = *flagVerbose

	// 1. Setup status. Abort if already initialized.
	var status struct {
		Required bool `json:"required"`
	}
	if _, err := admin.do("GET", "/api/setup/status", nil, &status); err != nil {
		log.Fatalf("setup status: %v", err)
	}
	if !status.Required {
		log.Fatalf("server already initialized — point loadtest at a fresh DB (use scripts/run-loadtest.sh)")
	}

	// 2. Setup → admin code.
	var setupResp struct {
		Code string `json:"code"`
	}
	if _, err := admin.do("POST", "/api/setup", nil, &setupResp); err != nil {
		log.Fatalf("setup: %v", err)
	}
	log.Printf("admin code: %s", setupResp.Code)

	// 3. Login admin.
	var adminToken string
	if _, err := admin.do("POST", "/api/login",
		map[string]string{"role": "admin", "code": setupResp.Code}, &adminToken); err != nil {
		log.Fatalf("admin login: %v", err)
	}
	admin.token = adminToken
	log.Printf("admin logged in")

	// 4. Create card and set to in_progress.
	if _, err := admin.do("POST", "/api/cards",
		map[string]string{"name": *flagCardName, "date": time.Now().Format("2006-01-02")}, nil); err != nil {
		log.Fatalf("create card: %v", err)
	}
	var cards []struct {
		ID             uint   `json:"id"`
		Name           string `json:"name"`
		NumberOfJudges int    `json:"numberOfJudges"`
	}
	if _, err := admin.do("GET", "/api/cards", nil, &cards); err != nil {
		log.Fatalf("list cards: %v", err)
	}
	var cardID uint
	for _, c := range cards {
		if c.Name == *flagCardName {
			cardID = c.ID
			break
		}
	}
	if cardID == 0 {
		log.Fatalf("card not found after create")
	}
	inProgress := "in_progress"
	if _, err := admin.do("PUT", fmt.Sprintf("/api/cards/%d", cardID), map[string]any{
		"status":         &inProgress,
		"numberOfJudges": flagJudges,
	}, nil); err != nil {
		log.Fatalf("activate card: %v", err)
	}
	log.Printf("card id=%d active with %d judges", cardID, *flagJudges)

	// 5. Create N bouts.
	t0 := time.Now()
	var boutLats latencies
	for i := 1; i <= *flagBouts; i++ {
		d, err := admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts", cardID), map[string]any{
			"boutNumber":  i,
			"weightClass": 70,
			"ageCategory": "elite",
			"experience":  "open",
			"gender":      "male",
			"boutType":    "scored",
		}, nil)
		boutLats.add(d, err)
		if err != nil {
			log.Printf("bout %d create failed: %v", i, err)
		}
	}
	log.Printf("created %d bouts in %v", *flagBouts, time.Since(t0))

	// Re-fetch bouts to get IDs.
	var bouts []struct {
		ID         uint `json:"id"`
		BoutNumber int  `json:"boutNumber"`
	}
	if _, err := admin.do("GET", fmt.Sprintf("/api/cards/%d/bouts", cardID), nil, &bouts); err != nil {
		log.Fatalf("list bouts: %v", err)
	}
	if len(bouts) != *flagBouts {
		log.Printf("warn: expected %d bouts, got %d", *flagBouts, len(bouts))
	}

	// 6. Generate judge codes and log them in.
	judges := make([]*client, *flagJudges)
	judgeCodes := make(map[string]string, *flagJudges)
	for i := 0; i < *flagJudges; i++ {
		role := fmt.Sprintf("judge%d", i+1)
		var code string
		if _, err := admin.do("POST", "/api/devices/code",
			map[string]string{"role": role}, &code); err != nil {
			log.Fatalf("generate code for %s: %v", role, err)
		}
		judgeCodes[role] = code
		jc := newClient(*flagBase)
		jc.verbose = *flagVerbose
		var token string
		if _, err := jc.do("POST", "/api/login",
			map[string]string{"role": role, "code": code}, &token); err != nil {
			log.Fatalf("%s login: %v", role, err)
		}
		jc.token = token
		judges[i] = jc
		log.Printf("%s logged in", role)
	}

	if *flagCredsOut != "" {
		creds := map[string]any{
			"base":       *flagBase,
			"cardId":     cardID,
			"cardName":   *flagCardName,
			"adminCode":  setupResp.Code,
			"judgeCodes": judgeCodes,
		}
		b, _ := json.MarshalIndent(creds, "", "  ")
		if err := os.WriteFile(*flagCredsOut, b, 0644); err != nil {
			log.Fatalf("write creds: %v", err)
		}
		log.Printf("wrote credentials to %s", *flagCredsOut)
	}

	if *flagSkipFlow {
		log.Printf("skip-flow set; exiting after seed")
		return
	}

	// 7. Drive each bout through full scoring flow.
	var scoreLats latencies
	var nextLats latencies
	var completeLats latencies
	var decisionLats latencies
	flowStart := time.Now()

	for bi, b := range bouts {
		if bi > 0 && bi%10 == 0 {
			log.Printf("progress: %d/%d bouts (elapsed %v)", bi, len(bouts), time.Since(flowStart))
		}
		for r := 1; r <= *flagRounds; r++ {
			// Advance round to in_progress: not_started → ready → in_progress.
			for k := 0; k < 2; k++ {
				d, err := admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/rounds/next", cardID, b.ID), nil, nil)
				nextLats.add(d, err)
				if err != nil && *flagVerbose {
					log.Printf("bout %d round %d next: %v", b.ID, r, err)
				}
			}

			// Concurrent judge scores.
			var wg sync.WaitGroup
			for _, j := range judges {
				wg.Add(1)
				red := rng.Intn(2) + 9 // 9 or 10
				blue := 19 - red
				go func(jc *client, red, blue int) {
					defer wg.Done()
					d, err := jc.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/rounds/%d/score", cardID, b.ID, r),
						map[string]int{"red": red, "blue": blue}, nil)
					scoreLats.add(d, err)
				}(j, red, blue)
			}
			wg.Wait()

			// in_progress → waiting_for_results.
			d, err := admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/rounds/next", cardID, b.ID), nil, nil)
			nextLats.add(d, err)

			// Each judge marks score complete.
			var cwg sync.WaitGroup
			for _, j := range judges {
				cwg.Add(1)
				go func(jc *client) {
					defer cwg.Done()
					d, err := jc.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/rounds/%d/score/complete", cardID, b.ID, r), nil, nil)
					completeLats.add(d, err)
				}(j)
			}
			cwg.Wait()

			// waiting_for_results → score_complete (when all judges done; admin nudge).
			d, err = admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/rounds/next", cardID, b.ID), nil, nil)
			nextLats.add(d, err)
			// score_complete → complete (advances bout to next round).
			d, err = admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/rounds/next", cardID, b.ID), nil, nil)
			nextLats.add(d, err)
		}

		// All rounds scored → make decision → show → complete bout.
		dDec, err := admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/decision/make", cardID, b.ID),
			map[string]string{"winner": "red", "decision": "unanimous", "comment": ""}, nil)
		decisionLats.add(dDec, err)
		_, _ = admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/decision/show", cardID, b.ID), nil, nil)
		_, _ = admin.do("POST", fmt.Sprintf("/api/cards/%d/bouts/%d/complete", cardID, b.ID), nil, nil)
	}

	flowDur := time.Since(flowStart)

	// Sanity: ensure all bouts ended completed.
	var after []struct {
		ID     uint   `json:"id"`
		Status string `json:"status"`
		Winner string `json:"winner"`
	}
	_, _ = admin.do("GET", fmt.Sprintf("/api/cards/%d/bouts", cardID), nil, &after)
	completed := 0
	for _, b := range after {
		if b.Status == "completed" {
			completed++
		}
	}

	// 8. Print summary.
	fmt.Println()
	fmt.Println("==================== Load Test Summary ====================")
	fmt.Printf("base:           %s\n", *flagBase)
	fmt.Printf("bouts created:  %d\n", *flagBouts)
	fmt.Printf("bouts complete: %d/%d\n", completed, len(after))
	fmt.Printf("judges:         %d\n", *flagJudges)
	fmt.Printf("rounds/bout:    %d\n", *flagRounds)
	fmt.Printf("flow duration:  %v\n", flowDur)
	fmt.Printf("score calls:    %d\n", len(scoreLats.all))
	fmt.Printf("throughput:     %.1f scores/sec\n", float64(len(scoreLats.all))/flowDur.Seconds())
	fmt.Println("latencies:")
	boutLats.summary("bout.create")
	scoreLats.summary("score.submit (judges)")
	completeLats.summary("score.complete (judges)")
	nextLats.summary("rounds.next (admin)")
	decisionLats.summary("decision.make (admin)")
	fmt.Println("===========================================================")

	if completed != len(after) {
		fmt.Fprintln(os.Stderr, "FAIL: not all bouts completed")
		os.Exit(1)
	}
}
