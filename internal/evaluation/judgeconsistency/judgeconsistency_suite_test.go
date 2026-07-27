package judgeconsistency_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestJudgeConsistency(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "JudgeConsistency Suite")
}
