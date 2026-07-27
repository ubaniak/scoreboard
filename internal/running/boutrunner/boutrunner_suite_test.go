package boutrunner_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBoutrunner(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Boutrunner Suite")
}
