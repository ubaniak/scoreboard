package bouts_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBouts(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Bouts Suite")
}
