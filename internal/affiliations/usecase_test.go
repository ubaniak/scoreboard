package affiliations_test

import (
	"github.com/ubaniak/scoreboard/internal/affiliations"
	"github.com/ubaniak/scoreboard/internal/affiliations/entities"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Affiliations Usecase", func() {
	var db *gorm.DB
	var storage affiliations.Storage
	var useCase affiliations.UseCase

	BeforeEach(func() {
		var err error
		db, err = gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
		Expect(err).NotTo(HaveOccurred())

		storage, err = affiliations.NewSqlite(db)
		Expect(err).NotTo(HaveOccurred())

		useCase = affiliations.NewUseCase(storage)
	})

	Describe("FindOrCreate", func() {
		It("creates new affiliation if not exists", func() {
			id, err := useCase.FindOrCreate("Team Alpha", entities.AffiliationTypeClub)
			Expect(err).NotTo(HaveOccurred())
			Expect(id).To(BeNumerically(">", 0))

			// Verify it was created
			aff, err := useCase.Get(id)
			Expect(err).NotTo(HaveOccurred())
			Expect(aff.Name).To(Equal("Team Alpha"))
			Expect(aff.Type).To(Equal(entities.AffiliationTypeClub))
		})

		It("returns existing affiliation ID", func() {
			id1, err := useCase.FindOrCreate("Ontario", entities.AffiliationTypeProvince)
			Expect(err).NotTo(HaveOccurred())

			id2, err := useCase.FindOrCreate("Ontario", entities.AffiliationTypeProvince)
			Expect(err).NotTo(HaveOccurred())

			Expect(id1).To(Equal(id2))
		})

		It("creates separate affiliations for different types with same name", func() {
			idClub, err := useCase.FindOrCreate("Canada", entities.AffiliationTypeClub)
			Expect(err).NotTo(HaveOccurred())

			idNation, err := useCase.FindOrCreate("Canada", entities.AffiliationTypeNation)
			Expect(err).NotTo(HaveOccurred())

			Expect(idClub).NotTo(Equal(idNation))
		})
	})

	Describe("ListByType", func() {
		It("returns only affiliations of specified type", func() {
			useCase.Create("Club A", entities.AffiliationTypeClub)
			useCase.Create("Club B", entities.AffiliationTypeClub)
			useCase.Create("Ontario", entities.AffiliationTypeProvince)

			clubs, err := useCase.ListByType(entities.AffiliationTypeClub)
			Expect(err).NotTo(HaveOccurred())
			Expect(clubs).To(HaveLen(2))

			provinces, err := useCase.ListByType(entities.AffiliationTypeProvince)
			Expect(err).NotTo(HaveOccurred())
			Expect(provinces).To(HaveLen(1))
		})
	})

	Describe("FindOrCreateByName", func() {
		It("finds or creates club affiliation", func() {
			id1, err := useCase.FindOrCreateByName("Team X")
			Expect(err).NotTo(HaveOccurred())

			aff, err := useCase.Get(id1)
			Expect(err).NotTo(HaveOccurred())
			Expect(aff.Type).To(Equal(entities.AffiliationTypeClub))

			id2, err := useCase.FindOrCreateByName("Team X")
			Expect(err).NotTo(HaveOccurred())
			Expect(id1).To(Equal(id2))
		})
	})
})
