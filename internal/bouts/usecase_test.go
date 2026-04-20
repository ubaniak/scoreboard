package bouts_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.uber.org/mock/gomock"

	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/bouts/mocks"
)

var _ = Describe("UseCase", func() {
	Describe("End", func() {
		type makeDecisionEntry struct {
			cardId   uint
			boutId   uint
			winner   string
			decision string
			comment  string
		}

		DescribeTable("happy path",
			func(entry makeDecisionEntry) {
				ctrl := gomock.NewController(GinkgoT())

				storage := mocks.NewMockStorage(ctrl)
				comments := mocks.NewMockCommentUseCase(ctrl)
				roundUC := mocks.NewMockRoundUseCase(ctrl)
				scoresUC := mocks.NewMockScoresUseCase(ctrl)

				storage.EXPECT().
					Update(entry.cardId, entry.boutId, gomock.Any()).
					Return(nil)
				storage.EXPECT().
					SetStatus(entry.cardId, entry.boutId, entities.BoutStatusDecisionMade).
					Return(nil)
				if entry.comment != "" {
					comments.EXPECT().
						Add("bout", entry.boutId, entry.comment).
						Return(nil)
				}

				uc := bouts.NewUseCase(storage, roundUC, comments, scoresUC)
				err := uc.MakeDecision(entry.cardId, entry.boutId, entry.winner, entry.decision, entry.comment)

				Expect(err).ToNot(HaveOccurred())
			},
			Entry("red wins by unanimous decision",
				makeDecisionEntry{cardId: 1, boutId: 1, winner: "red", decision: "ud", comment: ""},
			),
			Entry("blue wins by split decision with a comment",
				makeDecisionEntry{cardId: 1, boutId: 2, winner: "blue", decision: "sd", comment: "great fight"},
			),
			Entry("bout cancelled with no winner",
				makeDecisionEntry{cardId: 2, boutId: 3, winner: "na", decision: "c", comment: ""},
			),
			Entry("referee stop contest with comment",
				makeDecisionEntry{cardId: 3, boutId: 4, winner: "red", decision: "rsc", comment: "corner stopped the bout"},
			),
		)
	})
})
