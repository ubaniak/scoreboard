package appserver

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestAppserver(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Appserver Suite")
}
