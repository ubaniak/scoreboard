package bouts_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.uber.org/mock/gomock"

	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts"
	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts/mocks"
)

func uintPtr(v uint) *uint { return &v }

var _ = Describe("Roster availability flip", func() {
	var (
		ctrl     *gomock.Controller
		storage  *mocks.MockStorage
		roundUC  *mocks.MockRoundUseCase
		comments *mocks.MockCommentUseCase
		scoresUC *mocks.MockScoresUseCase
		rosterUC *mocks.MockRosterAvailability
		uc       bouts.UseCase
	)

	BeforeEach(func() {
		ctrl = gomock.NewController(GinkgoT())
		storage = mocks.NewMockStorage(ctrl)
		roundUC = mocks.NewMockRoundUseCase(ctrl)
		comments = mocks.NewMockCommentUseCase(ctrl)
		scoresUC = mocks.NewMockScoresUseCase(ctrl)
		rosterUC = mocks.NewMockRosterAvailability(ctrl)

		uc = bouts.NewUseCase(storage, roundUC, comments, scoresUC)
		bouts.SetRosterAvailability(uc, rosterUC)
	})

	Describe("Create", func() {
		It("marks both matched athletes unavailable", func() {
			bout := &entities.Bout{
				BoutType:      entities.BoutTypeSparring,
				RedAthleteID:  uintPtr(10),
				BlueAthleteID: uintPtr(20),
			}
			storage.EXPECT().Save(uint(1), bout).Return(uint(99), nil)
			roundUC.EXPECT().CreateRounds(uint(99)).Return(nil)
			rosterUC.EXPECT().SetAvailable(uint(1), uint(10), false).Return(nil)
			rosterUC.EXPECT().SetAvailable(uint(1), uint(20), false).Return(nil)

			Expect(uc.Create(1, bout)).To(Succeed())
		})

		It("propagates an error from the roster flip", func() {
			bout := &entities.Bout{
				BoutType:     entities.BoutTypeSparring,
				RedAthleteID: uintPtr(10),
			}
			storage.EXPECT().Save(uint(1), bout).Return(uint(99), nil)
			roundUC.EXPECT().CreateRounds(uint(99)).Return(nil)
			rosterUC.EXPECT().SetAvailable(uint(1), uint(10), false).Return(errBoom)

			Expect(uc.Create(1, bout)).To(MatchError(errBoom))
		})
	})

	Describe("Update", func() {
		It("frees the old athlete and marks the new one unavailable when a corner is swapped", func() {
			current := &entities.Bout{RedAthleteID: uintPtr(10), BlueAthleteID: uintPtr(20)}
			storage.EXPECT().Get(uint(1), uint(99)).Return(current, nil)

			newRed := uintPtr(30)
			update := &entities.UpdateBout{RedAthleteID: &newRed}
			storage.EXPECT().Update(uint(1), uint(99), update).Return(nil)

			rosterUC.EXPECT().SetAvailable(uint(1), uint(10), true).Return(nil)
			rosterUC.EXPECT().SetAvailable(uint(1), uint(30), false).Return(nil)

			Expect(uc.Update(1, 99, update)).To(Succeed())
		})

		It("frees the old athlete when the corner is cleared", func() {
			current := &entities.Bout{RedAthleteID: uintPtr(10)}
			storage.EXPECT().Get(uint(1), uint(99)).Return(current, nil)

			var cleared *uint
			update := &entities.UpdateBout{RedAthleteID: &cleared}
			storage.EXPECT().Update(uint(1), uint(99), update).Return(nil)

			rosterUC.EXPECT().SetAvailable(uint(1), uint(10), true).Return(nil)

			Expect(uc.Update(1, 99, update)).To(Succeed())
		})

		It("does not touch the roster when athletes are unchanged", func() {
			update := &entities.UpdateBout{BoutNumber: ptrInt(3)}
			storage.EXPECT().Update(uint(1), uint(99), update).Return(nil)

			Expect(uc.Update(1, 99, update)).To(Succeed())
		})
	})

	Describe("Delete", func() {
		It("frees both matched athletes before deleting", func() {
			current := &entities.Bout{RedAthleteID: uintPtr(10), BlueAthleteID: uintPtr(20)}
			storage.EXPECT().Get(uint(1), uint(99)).Return(current, nil)
			rosterUC.EXPECT().SetAvailable(uint(1), uint(10), true).Return(nil)
			rosterUC.EXPECT().SetAvailable(uint(1), uint(20), true).Return(nil)
			storage.EXPECT().Delete(uint(1), uint(99)).Return(nil)

			Expect(uc.Delete(1, 99)).To(Succeed())
		})
	})
})

func ptrInt(v int) *int { return &v }

var errBoom = errBoomType{}

type errBoomType struct{}

func (errBoomType) Error() string { return "boom" }
