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
		type endBoutEntry struct {
			cardId   uint
			boutId   uint
			winner   string
			decision string
			comment  string
		}

		DescribeTable("happy path",
			func(entry endBoutEntry) {
				ctrl := gomock.NewController(GinkgoT())

				storage := mocks.NewMockStorage(ctrl)
				comments := mocks.NewMockCommentUseCase(ctrl)
				roundUC := mocks.NewMockRoundUseCase(ctrl)
				scoresUC := mocks.NewMockScoresUseCase(ctrl)

				storage.EXPECT().
					Update(entry.cardId, entry.boutId, gomock.Any()).
					Return(nil)
				storage.EXPECT().
					SetStatus(entry.cardId, entry.boutId, entities.BoutStatusCompleted).
					Return(nil)
				if entry.comment != "" {
					comments.EXPECT().
						Add("bout", entry.boutId, entry.comment).
						Return(nil)
				}

				uc := bouts.NewUseCase(storage, roundUC, comments, scoresUC)
				err := uc.End(entry.cardId, entry.boutId, entry.winner, entry.decision, entry.comment)

				Expect(err).ToNot(HaveOccurred())
			},
			Entry("red wins by unanimous decision",
				endBoutEntry{cardId: 1, boutId: 1, winner: "red", decision: "ud", comment: ""},
			),
			Entry("blue wins by split decision with a comment",
				endBoutEntry{cardId: 1, boutId: 2, winner: "blue", decision: "sd", comment: "great fight"},
			),
			Entry("bout cancelled with no winner",
				endBoutEntry{cardId: 2, boutId: 3, winner: "na", decision: "c", comment: ""},
			),
			Entry("referee stop contest with comment",
				endBoutEntry{cardId: 3, boutId: 4, winner: "red", decision: "rsc", comment: "corner stopped the bout"},
			),
		)
	})
})
