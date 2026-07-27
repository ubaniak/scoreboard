package scores_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestScores(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Scores Suite")
}
