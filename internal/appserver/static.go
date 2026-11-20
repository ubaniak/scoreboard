package appserver

import (
	"mime"
	"path"
	"strings"
)

func init() {
	// Go's mime table doesn't know .webmanifest; browsers expect this type
	// for the PWA manifest.
	_ = mime.AddExtensionType(".webmanifest", "application/manifest+json")
}

// cacheControlFor returns the Cache-Control header for a file in the
// embedded frontend build (path relative to dist, no leading slash).
//
//   - The app shell and PWA plumbing (index.html, sw.js, registerSW.js,
//     manifest.webmanifest) must always be revalidated, otherwise installed
//     apps on judges' phones can get stuck on an old build.
//   - Vite's content-hashed bundles under assets/ never change, so they can be
//     cached forever.
//   - Everything else gets the browser default (no header).
func cacheControlFor(p string) string {
	p = strings.TrimPrefix(p, "/")
	switch p {
	case "", "index.html", "sw.js", "registerSW.js", "manifest.webmanifest":
		return "no-cache"
	}
	if strings.HasPrefix(p, "assets/") {
		return "public, max-age=31536000, immutable"
	}
	if base := path.Base(p); strings.HasPrefix(base, "workbox-") && strings.HasSuffix(base, ".js") {
		return "public, max-age=31536000, immutable"
	}
	return ""
}
