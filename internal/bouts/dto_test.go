package bouts_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/bouts/entities"
)

var _ = Describe("RoundLength", func() {
	type roundLengthEntry struct {
		ageCategory entities.AgeCategory
		experience  entities.Experience
		expected    entities.RoundLength
	}

	DescribeTable("happy path",
		func(entry roundLengthEntry) {
			result := bouts.RoundLength(entry.ageCategory, entry.experience)
			Expect(result).To(Equal(entry.expected))
		},
		Entry("junior A always gets 1 minute",
			roundLengthEntry{ageCategory: entities.JuniorA, experience: entities.Novice, expected: entities.OneMinute},
		),
		Entry("junior B always gets 1.5 minutes",
			roundLengthEntry{ageCategory: entities.JuniorB, experience: entities.Novice, expected: entities.OneHalfMinute},
		),
		Entry("masters always gets 1.5 minutes",
			roundLengthEntry{ageCategory: entities.Masters, experience: entities.Open, expected: entities.OneHalfMinute},
		),
		Entry("open experience gets 3 minutes",
			roundLengthEntry{ageCategory: entities.Elite, experience: entities.Open, expected: entities.ThreeMinutes},
		),
		Entry("novice experience defaults to 2 minutes",
			roundLengthEntry{ageCategory: entities.Elite, experience: entities.Novice, expected: entities.TwoMinutes},
		),
	)
})

var _ = Describe("GloveSize", func() {
	type gloveSizeEntry struct {
		weightClass int
		ageCategory entities.AgeCategory
		gender      entities.Gender
		expected    entities.GloveSize
	}

	DescribeTable("happy path",
		func(entry gloveSizeEntry) {
			result := bouts.GloveSize(entry.weightClass, entry.ageCategory, entry.gender)
			Expect(result).To(Equal(entry.expected))
		},
		Entry("female always gets 10oz",
			gloveSizeEntry{weightClass: 80, ageCategory: entities.Elite, gender: entities.Female, expected: entities.TenOz},
		),
		Entry("masters always gets 16oz",
			gloveSizeEntry{weightClass: 60, ageCategory: entities.Masters, gender: entities.Male, expected: entities.SixteenOz},
		),
		Entry("male at or under 70kg gets 10oz",
			gloveSizeEntry{weightClass: 70, ageCategory: entities.Elite, gender: entities.Male, expected: entities.TenOz},
		),
		Entry("male over 70kg gets 12oz",
			gloveSizeEntry{weightClass: 71, ageCategory: entities.Elite, gender: entities.Male, expected: entities.TwelveOz},
		),
	)
})

var _ = Describe("CreateRequestToEntity", func() {
	type createRequestEntry struct {
		request         bouts.CreateRequest
		cardId          uint
		expectedGlove   entities.GloveSize
		expectedRound   entities.RoundLength
		expectedStatus  entities.BoutStatus
	}

	DescribeTable("happy path",
		func(entry createRequestEntry) {
			result := bouts.CreateRequestToEntity(entry.cardId, &entry.request)

			Expect(result.CardID).To(Equal(entry.cardId))
			Expect(result.BoutNumber).To(Equal(entry.request.BoutNumber))
			Expect(result.GloveSize).To(Equal(entry.expectedGlove))
			Expect(result.RoundLength).To(Equal(entry.expectedRound))
			Expect(result.Status).To(Equal(entities.BoutStatusNotStarted))
		},
		Entry("male novice elite under 70kg",
			createRequestEntry{
				cardId: 1,
				request: bouts.CreateRequest{
					BoutNumber:  1,
					WeightClass: 65,
					AgeCategory: string(entities.Elite),
					Experience:  string(entities.Novice),
					Gender:      string(entities.Male),
				},
				expectedGlove:  entities.TenOz,
				expectedRound:  entities.TwoMinutes,
				expectedStatus: entities.BoutStatusNotStarted,
			},
		),
		Entry("male open elite over 70kg",
			createRequestEntry{
				cardId: 2,
				request: bouts.CreateRequest{
					BoutNumber:  2,
					WeightClass: 75,
					AgeCategory: string(entities.Elite),
					Experience:  string(entities.Open),
					Gender:      string(entities.Male),
				},
				expectedGlove:  entities.TwelveOz,
				expectedRound:  entities.ThreeMinutes,
				expectedStatus: entities.BoutStatusNotStarted,
			},
		),
		Entry("female junior A",
			createRequestEntry{
				cardId: 3,
				request: bouts.CreateRequest{
					BoutNumber:  3,
					WeightClass: 55,
					AgeCategory: string(entities.JuniorA),
					Experience:  string(entities.Novice),
					Gender:      string(entities.Female),
				},
				expectedGlove:  entities.TenOz,
				expectedRound:  entities.OneMinute,
				expectedStatus: entities.BoutStatusNotStarted,
			},
		),
	)
})
