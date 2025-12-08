package auth_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.uber.org/mock/gomock"

	"github.com/ubaniak/scoreboard/internal/auth"
	mock "github.com/ubaniak/scoreboard/internal/auth/mocks"
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

var _ = Describe("Usecase", func() {

	var (
		usecase     auth.UseCase
		mockStorage *mock.MockStorage
		mockCtrl    *gomock.Controller
	)

	Describe("Register", func() {
		var (
			role  string
			limit int
			code  string
			err   error
		)

		BeforeEach(func() {
			mockCtrl = gomock.NewController(GinkgoT())
			mockStorage = mock.NewMockStorage(mockCtrl)
			role = "test-role"
			limit = 5
			mockStorage.EXPECT().Save(gomock.Any()).Return(nil)
		})

		AfterEach(func() {
			mockCtrl.Finish()
		})

		JustBeforeEach(func() {
			usecase = auth.NewUseCase(mockStorage, "test-sign-key")
			code, err = usecase.Register(role, limit)
		})

		It("should not error", func() {
			Expect(err).To(BeNil())
		})
		It("should return a code", func() {
			Expect(code).ToNot(BeEmpty())
		})
	})
})
