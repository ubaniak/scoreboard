package comment_test

import (
	"github.com/ubaniak/scoreboard/internal/comment"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Comment Usecase", func() {
	var db *gorm.DB
	var storage comment.Storage
	var useCase comment.UseCase

	BeforeEach(func() {
		var err error
		db, err = gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
		Expect(err).NotTo(HaveOccurred())

		storage, err = comment.NewSqlite(db)
		Expect(err).NotTo(HaveOccurred())

		useCase = comment.NewUseCase(storage)
	})

	Describe("Add and Get", func() {
		It("returns a positive id and the comment with its id populated", func() {
			id, err := useCase.Add("bout", 1, "great fight")
			Expect(err).NotTo(HaveOccurred())
			Expect(id).To(BeNumerically(">", 0))

			comments, err := useCase.Get("bout", 1)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments).To(HaveLen(1))
			Expect(comments[0].ID).To(Equal(id))
			Expect(comments[0].Comment).To(Equal("great fight"))
		})

		It("does not cross-contaminate between different entity ids", func() {
			_, err := useCase.Add("bout", 1, "comment for bout 1")
			Expect(err).NotTo(HaveOccurred())
			_, err = useCase.Add("bout", 2, "comment for bout 2")
			Expect(err).NotTo(HaveOccurred())

			comments1, err := useCase.Get("bout", 1)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments1).To(HaveLen(1))
			Expect(comments1[0].Comment).To(Equal("comment for bout 1"))

			comments2, err := useCase.Get("bout", 2)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments2).To(HaveLen(1))
			Expect(comments2[0].Comment).To(Equal("comment for bout 2"))
		})
	})

	Describe("Update", func() {
		It("changes the comment text when the entity kind and id match", func() {
			id, err := useCase.Add("bout", 1, "original")
			Expect(err).NotTo(HaveOccurred())

			err = useCase.Update("bout", 1, id, "updated")
			Expect(err).NotTo(HaveOccurred())

			comments, err := useCase.Get("bout", 1)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments).To(HaveLen(1))
			Expect(comments[0].Comment).To(Equal("updated"))
		})

		It("errors when the comment does not belong to the given entity", func() {
			id, err := useCase.Add("bout", 1, "original")
			Expect(err).NotTo(HaveOccurred())

			err = useCase.Update("bout", 2, id, "updated")
			Expect(err).To(HaveOccurred())

			comments, err := useCase.Get("bout", 1)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments[0].Comment).To(Equal("original"))
		})
	})

	Describe("Delete", func() {
		It("removes the comment when the entity kind and id match", func() {
			id, err := useCase.Add("bout", 1, "to be deleted")
			Expect(err).NotTo(HaveOccurred())

			err = useCase.Delete("bout", 1, id)
			Expect(err).NotTo(HaveOccurred())

			comments, err := useCase.Get("bout", 1)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments).To(BeEmpty())
		})

		It("errors and does not delete when the comment does not belong to the given entity", func() {
			id, err := useCase.Add("bout", 1, "keep me")
			Expect(err).NotTo(HaveOccurred())

			err = useCase.Delete("bout", 2, id)
			Expect(err).To(HaveOccurred())

			comments, err := useCase.Get("bout", 1)
			Expect(err).NotTo(HaveOccurred())
			Expect(comments).To(HaveLen(1))
		})
	})
})
