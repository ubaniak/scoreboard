package auth_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func add(a, b int) int {
	return a + b
}

var _ = Describe("Add", func() {
	var (
		x int
		y int
		z int
	)

	BeforeEach(func() {
		x = 2
		y = 3
	})

	JustBeforeEach(func() {
		z = add(x, y)
	})

	It("should add two numbers correctly", func() {
		Expect(z).To(Equal(5))
	})
})
