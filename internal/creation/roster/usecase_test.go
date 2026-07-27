package roster_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.uber.org/mock/gomock"

	athleteEntities "github.com/ubaniak/scoreboard/internal/creation/athletes/entities"
	"github.com/ubaniak/scoreboard/internal/creation/roster"
	"github.com/ubaniak/scoreboard/internal/creation/roster/entities"
	"github.com/ubaniak/scoreboard/internal/creation/roster/mocks"
)

var _ = Describe("UseCase", func() {
	var (
		ctrl        *gomock.Controller
		storage     *mocks.MockStorage
		athletesUC  *mocks.MockUseCase
		boutQuerier *mocks.MockBoutAthleteQuerier
		uc          roster.UseCase
	)

	BeforeEach(func() {
		ctrl = gomock.NewController(GinkgoT())
		storage = mocks.NewMockStorage(ctrl)
		athletesUC = mocks.NewMockUseCase(ctrl)
		boutQuerier = mocks.NewMockBoutAthleteQuerier(ctrl)

		uc = roster.NewUseCase(storage, athletesUC)
		roster.SetBoutQuerier(uc, boutQuerier)
	})

	Describe("Add", func() {
		It("adds the athlete once they're confirmed to exist", func() {
			athletesUC.EXPECT().Get(uint(5)).Return(&athleteEntities.Athlete{ID: 5}, nil)
			storage.EXPECT().Add(uint(1), uint(5)).Return(nil)

			Expect(uc.Add(1, 5)).To(Succeed())
		})

		It("fails without touching storage if the athlete doesn't exist", func() {
			athletesUC.EXPECT().Get(uint(5)).Return(nil, errNotFound)

			Expect(uc.Add(1, 5)).To(MatchError(errNotFound))
		})
	})

	Describe("Remove", func() {
		It("blocks removal while the athlete is matched into a bout on the card", func() {
			boutQuerier.EXPECT().IsAthleteMatched(uint(1), uint(5)).Return(true, nil)

			Expect(uc.Remove(1, 5)).To(MatchError(roster.ErrAthleteMatched))
		})

		It("allows removal once the athlete is no longer matched", func() {
			boutQuerier.EXPECT().IsAthleteMatched(uint(1), uint(5)).Return(false, nil)
			storage.EXPECT().Remove(uint(1), uint(5)).Return(nil)

			Expect(uc.Remove(1, 5)).To(Succeed())
		})
	})

	Describe("ToggleAvailable (admin-facing)", func() {
		It("blocks marking a matched athlete unavailable", func() {
			boutQuerier.EXPECT().IsAthleteMatched(uint(1), uint(5)).Return(true, nil)

			Expect(uc.ToggleAvailable(1, 5, false)).To(MatchError(roster.ErrAthleteMatched))
		})

		It("allows marking an athlete available regardless of match state", func() {
			storage.EXPECT().SetAvailable(uint(1), uint(5), true).Return(nil)

			Expect(uc.ToggleAvailable(1, 5, true)).To(Succeed())
		})

		It("allows marking an unmatched athlete unavailable", func() {
			boutQuerier.EXPECT().IsAthleteMatched(uint(1), uint(5)).Return(false, nil)
			storage.EXPECT().SetAvailable(uint(1), uint(5), false).Return(nil)

			Expect(uc.ToggleAvailable(1, 5, false)).To(Succeed())
		})
	})

	Describe("SetAvailable (internal, unguarded)", func() {
		It("is not blocked by the bout-matched guard, since bout creation calls this to record the match", func() {
			storage.EXPECT().SetAvailable(uint(1), uint(5), false).Return(nil)

			Expect(uc.SetAvailable(1, 5, false)).To(Succeed())
		})
	})

	Describe("ListForCard", func() {
		It("enriches each roster entry with athlete details", func() {
			storage.EXPECT().ListForCard(uint(1)).Return([]entities.RosterEntry{
				{CardID: 1, AthleteID: 5, Available: true},
			}, nil)
			weight := 65.5
			athletesUC.EXPECT().Get(uint(5)).Return(&athleteEntities.Athlete{
				ID: 5, Name: "Ali", Gender: "male", AgeCategory: "elite", Experience: "open", WeightClass: &weight,
			}, nil)

			result, err := uc.ListForCard(1)
			Expect(err).ToNot(HaveOccurred())
			Expect(result).To(HaveLen(1))
			Expect(result[0].AthleteName).To(Equal("Ali"))
			Expect(result[0].WeightClass).To(Equal(&weight))
		})
	})
})

type errNotFoundType struct{}

func (errNotFoundType) Error() string { return "not found" }

var errNotFound = errNotFoundType{}
