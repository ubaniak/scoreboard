package roster_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestRoster(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Roster Suite")
}
