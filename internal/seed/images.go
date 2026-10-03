package seed

import (
	"fmt"
	"hash/fnv"
	"html"
	"os"
	"path/filepath"
	"strings"

	"github.com/ubaniak/scoreboard/internal/datadir"
)

// Demo images are generated as SVG so the seed needs no binary assets. Each
// one is written under the uploads directory at the same path the upload
// endpoints use (/uploads/<kind>/<id>.<ext>), so the app serves it normally.

// badgeSVG draws a coloured tile with the name's initials. Circles stand in
// for club logos; squares stand in for athlete photos.
func badgeSVG(name string, circle bool) []byte {
	shape := fmt.Sprintf(`<rect width="256" height="256" fill="%s"/>`, colourFor(name))
	if circle {
		shape = fmt.Sprintf(`<circle cx="128" cy="128" r="128" fill="%s"/>`, colourFor(name))
	}
	return []byte(fmt.Sprintf(
		`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">%s<text x="128" y="128" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">%s</text></svg>`,
		shape, html.EscapeString(initials(name)),
	))
}

// cardBackgroundSVG is a wide gradient with the card name faintly across it,
// for the "show card image as background" option.
func cardBackgroundSVG(cardName string) []byte {
	hue := hueOf(cardName)
	return []byte(fmt.Sprintf(
		`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(%d,60%%,22%%)"/><stop offset="1" stop-color="hsl(%d,70%%,8%%)"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/><text x="960" y="540" font-family="Helvetica, Arial, sans-serif" font-size="180" font-weight="800" fill="#ffffff" fill-opacity="0.12" text-anchor="middle" dominant-baseline="central">%s</text></svg>`,
		hue, (hue+40)%360, html.EscapeString(strings.ToUpper(cardName)),
	))
}

// setImage writes body to the uploads folder and points the record at it.
func setImage(kind string, id uint, body []byte, set func(uint, string) error) error {
	uploads, err := datadir.UploadsDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(uploads, kind)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	file := fmt.Sprintf("%d.svg", id)
	if err := os.WriteFile(filepath.Join(dir, file), body, 0644); err != nil {
		return err
	}
	return set(id, fmt.Sprintf("/uploads/%s/%s", kind, file))
}

func initials(name string) string {
	var b strings.Builder
	for _, part := range strings.Fields(name) {
		b.WriteString(strings.ToUpper(part[:1]))
		if b.Len() == 2 {
			break
		}
	}
	return b.String()
}

func hueOf(s string) int {
	h := fnv.New32a()
	h.Write([]byte(s))
	return int(h.Sum32() % 360)
}

func colourFor(s string) string {
	return fmt.Sprintf("hsl(%d,55%%,38%%)", hueOf(s))
}
