package reports

import (
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"io"
	"strconv"
	"strings"

	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/goregular"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

// Layout is rendered at 2x so text stays crisp on high-DPI screens.
const (
	imgWidth    = 2000
	imgPadding  = 96
	imgRowH     = 168
	imgRowGap   = 24
	imgHeaderH  = 240
	imgCornerR  = 20
	imgNameGap  = 220 // distance from center to the inner edge of each name column
	imgNumColW  = 140 // reserved width for the bout-number column
)

var (
	bgColor    = color.RGBA{0x0b, 0x0f, 0x1a, 0xff}
	rowBgColor = color.RGBA{0x13, 0x19, 0x29, 0xff}
	redColor   = color.RGBA{0xfc, 0xa5, 0xa5, 0xff}
	blueColor  = color.RGBA{0x93, 0xc5, 0xfd, 0xff}
	whiteColor = color.RGBA{0xff, 0xff, 0xff, 0xff}

	// x/image/font's glyph rasterizer renders hollow glyphs when the text
	// color itself carries alpha, so "faint" text colors are pre-blended
	// against their known solid backgrounds and drawn fully opaque instead.
	titleColor    = blendOver(color.RGBA{0xff, 0xff, 0xff, 0xb3}, bgColor)
	subtitleColor = blendOver(color.RGBA{0xff, 0xff, 0xff, 0x80}, bgColor)
	faintColor    = blendOver(color.RGBA{0xff, 0xff, 0xff, 0x73}, rowBgColor)
	boutNumColor  = blendOver(color.RGBA{0xff, 0xff, 0xff, 0x66}, rowBgColor)
)

// blendOver composites fg (with its own alpha) over an opaque bg and returns
// a fully-opaque result color.
func blendOver(fg, bg color.RGBA) color.RGBA {
	a := float64(fg.A) / 255
	blend := func(f, b uint8) uint8 {
		return uint8(float64(f)*a + float64(b)*(1-a))
	}
	return color.RGBA{
		R: blend(fg.R, bg.R),
		G: blend(fg.G, bg.G),
		B: blend(fg.B, bg.B),
		A: 0xff,
	}
}

func mustParseFont(ttf []byte) *opentype.Font {
	f, err := opentype.Parse(ttf)
	if err != nil {
		panic(err)
	}
	return f
}

func faceAt(f *opentype.Font, size float64) font.Face {
	face, err := opentype.NewFace(f, &opentype.FaceOptions{
		Size:    size,
		DPI:     96,
		Hinting: font.HintingNone,
	})
	if err != nil {
		panic(err)
	}
	return face
}

// roundedRectMask returns an alpha mask for a filled rounded rectangle of the given size.
func roundedRectMask(w, h, r int) *image.Alpha {
	mask := image.NewAlpha(image.Rect(0, 0, w, h))
	for y := range h {
		for x := range w {
			in := true
			cx, cy := 0, 0
			corner := false
			switch {
			case x < r && y < r:
				cx, cy, corner = r, r, true
			case x >= w-r && y < r:
				cx, cy, corner = w-r-1, r, true
			case x < r && y >= h-r:
				cx, cy, corner = r, h-r-1, true
			case x >= w-r && y >= h-r:
				cx, cy, corner = w-r-1, h-r-1, true
			}
			if corner {
				dx, dy := x-cx, y-cy
				if dx*dx+dy*dy > r*r {
					in = false
				}
			}
			if in {
				mask.SetAlpha(x, y, color.Alpha{A: 255})
			}
		}
	}
	return mask
}

func fillRoundedRect(dst draw.Image, rect image.Rectangle, c color.Color, radius int) {
	mask := roundedRectMask(rect.Dx(), rect.Dy(), radius)
	draw.DrawMask(dst, rect, &image.Uniform{C: c}, image.Point{}, mask, image.Point{}, draw.Over)
}

type textOpts struct {
	face  font.Face
	color color.Color
	align string // "left", "right", "center"
}

func measureWidth(face font.Face, s string) int {
	d := &font.Drawer{Face: face}
	return d.MeasureString(s).Round()
}

func drawText(dst draw.Image, s string, x, y int, opts textOpts) {
	if s == "" {
		return
	}
	d := &font.Drawer{
		Dst:  dst,
		Src:  &image.Uniform{C: opts.color},
		Face: opts.face,
	}
	width := measureWidth(opts.face, s)
	switch opts.align {
	case "right":
		x -= width
	case "center":
		x -= width / 2
	}
	d.Dot = fixed.Point26_6{X: fixed.I(x), Y: fixed.I(y)}
	d.DrawString(s)
}

// fitNameFace picks the largest of a few candidate sizes whose rendered width
// of s stays within maxWidth, falling back to the smallest if none fit.
func fitNameFace(boldFont *opentype.Font, s string, maxWidth int) font.Face {
	sizes := []float64{40, 34, 28, 24, 20}
	var face font.Face
	for _, size := range sizes {
		face = faceAt(boldFont, size)
		if measureWidth(face, s) <= maxWidth {
			return face
		}
	}
	return face
}

func winnerImageLabel(winner string) (string, color.Color) {
	switch winner {
	case "red":
		return "WINNER RED", redColor
	case "blue":
		return "WINNER BLUE", blueColor
	case "draw":
		return "DRAW", whiteColor
	default:
		return "", whiteColor
	}
}

// WritePublicJPEG renders the public results as a JPEG styled after the on-screen
// scoreboard bout list (dark card rows, red corner right, blue corner left, winner
// and decision centered).
func WritePublicJPEG(w io.Writer, rd *ReportData) error {
	boldFont := mustParseFont(gobold.TTF)
	regularFont := mustParseFont(goregular.TTF)

	titleFace := faceAt(boldFont, 52)
	subFace := faceAt(regularFont, 30)
	clubFace := faceAt(regularFont, 24)
	winnerFace := faceAt(boldFont, 26)
	decisionFace := faceAt(regularFont, 24)
	boutNumFace := faceAt(regularFont, 26)

	rows := len(rd.Bouts)
	if rows == 0 {
		rows = 1
	}
	height := imgHeaderH + rows*imgRowH + (rows-1)*imgRowGap + imgPadding

	img := image.NewRGBA(image.Rect(0, 0, imgWidth, height))
	draw.Draw(img, img.Bounds(), &image.Uniform{C: bgColor}, image.Point{}, draw.Src)

	centerX := imgWidth / 2

	drawText(img, strings.ToUpper(rd.CardName), centerX, 112, textOpts{face: titleFace, color: titleColor, align: "center"})
	sub := rd.CardDate
	if sub == "" {
		sub = "Results"
	}
	drawText(img, sub, centerX, 164, textOpts{face: subFace, color: subtitleColor, align: "center"})

	y := imgHeaderH
	redColX := centerX - imgNameGap
	blueColX := centerX + imgNameGap
	nameMaxWidth := redColX - imgPadding - imgNumColW

	for _, b := range rd.Bouts {
		rowRect := image.Rect(imgPadding, y, imgWidth-imgPadding, y+imgRowH)
		fillRoundedRect(img, rowRect, rowBgColor, imgCornerR)

		rowMid := y + imgRowH/2

		drawText(img, strconv.Itoa(b.BoutNumber), imgPadding+60, rowMid+8, textOpts{face: boutNumFace, color: boutNumColor, align: "center"})

		redFace := fitNameFace(boldFont, b.RedName, nameMaxWidth)
		drawText(img, b.RedName, redColX, rowMid-8, textOpts{face: redFace, color: redColor, align: "right"})
		if b.RedClub != "" {
			drawText(img, strings.ToUpper(b.RedClub), redColX, rowMid+32, textOpts{face: clubFace, color: faintColor, align: "right"})
		}

		blueFace := fitNameFace(boldFont, b.BlueName, nameMaxWidth)
		drawText(img, b.BlueName, blueColX, rowMid-8, textOpts{face: blueFace, color: blueColor, align: "left"})
		if b.BlueClub != "" {
			drawText(img, strings.ToUpper(b.BlueClub), blueColX, rowMid+32, textOpts{face: clubFace, color: faintColor, align: "left"})
		}

		label, labelColor := winnerImageLabel(b.Winner)
		if label != "" {
			drawText(img, label, centerX, rowMid-12, textOpts{face: winnerFace, color: labelColor, align: "center"})
			if b.Decision != "" {
				drawText(img, decisionLabel(b.Decision), centerX, rowMid+28, textOpts{face: decisionFace, color: faintColor, align: "center"})
			}
		} else {
			drawText(img, "VS", centerX, rowMid+8, textOpts{face: winnerFace, color: faintColor, align: "center"})
		}

		y += imgRowH + imgRowGap
	}

	return jpeg.Encode(w, img, &jpeg.Options{Quality: 92})
}
