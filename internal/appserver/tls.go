package appserver

import (
	"log"
	"net"
	"net/http"
	"os"
)

// tlsSettings configures the optional HTTPS listener.
//
// Phones only treat the scoreboard as an installable app (and only run its
// service worker) over HTTPS, or on localhost. On a venue LAN that means
// serving HTTPS with a certificate the devices trust, e.g. one made with
// mkcert. Plain HTTP on :8080 keeps working alongside it.
type tlsSettings struct {
	CertFile string
	KeyFile  string
	Addr     string
}

func (t tlsSettings) enabled() bool {
	return t.CertFile != "" && t.KeyFile != ""
}

// tlsConfigFromEnv reads SCOREBOARD_TLS_CERT, SCOREBOARD_TLS_KEY and
// SCOREBOARD_TLS_ADDR (default ":8443").
func tlsConfigFromEnv() tlsSettings {
	t := tlsSettings{
		CertFile: os.Getenv("SCOREBOARD_TLS_CERT"),
		KeyFile:  os.Getenv("SCOREBOARD_TLS_KEY"),
		Addr:     os.Getenv("SCOREBOARD_TLS_ADDR"),
	}
	if t.Addr == "" {
		t.Addr = ":8443"
	}
	if (t.CertFile == "") != (t.KeyFile == "") {
		log.Println("WARNING: set both SCOREBOARD_TLS_CERT and SCOREBOARD_TLS_KEY to enable HTTPS; HTTPS is off")
	}
	return t
}

// startTLSListener serves srv over HTTPS on a second listener. Because it is
// the same *http.Server, srv.Shutdown closes both listeners.
func startTLSListener(srv *http.Server, t tlsSettings, localIP string) {
	ln, err := net.Listen("tcp", t.Addr)
	if err != nil {
		log.Printf("WARNING: HTTPS disabled, could not listen on %s: %v", t.Addr, err)
		return
	}
	go func() {
		if err := srv.ServeTLS(ln, t.CertFile, t.KeyFile); err != nil && err != http.ErrServerClosed {
			log.Printf("WARNING: HTTPS server stopped: %v", err)
		}
	}()
	log.Printf("HTTPS enabled: https://localhost%s", t.Addr)
	if localIP != "" {
		log.Printf("Install on phones from: https://%s%s", localIP, t.Addr)
	}
}
