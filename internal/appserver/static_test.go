package appserver

import (
	"mime"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("static asset headers", func() {
	DescribeTable("cacheControlFor",
		func(p, want string) {
			Expect(cacheControlFor(p)).To(Equal(want))
		},
		Entry("root", "", "no-cache"),
		Entry("index", "index.html", "no-cache"),
		Entry("service worker", "sw.js", "no-cache"),
		Entry("service worker with slash", "/sw.js", "no-cache"),
		Entry("sw registration", "registerSW.js", "no-cache"),
		Entry("manifest", "manifest.webmanifest", "no-cache"),
		Entry("hashed bundle", "assets/index-abc123.js", "public, max-age=31536000, immutable"),
		Entry("workbox runtime", "workbox-1a2b3c.js", "public, max-age=31536000, immutable"),
		Entry("icon", "pwa-192x192.png", ""),
	)

	It("serves .webmanifest with the manifest MIME type", func() {
		Expect(mime.TypeByExtension(".webmanifest")).To(Equal("application/manifest+json"))
	})
})
