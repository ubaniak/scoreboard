package comment_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestComment(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Comment Suite")
}
