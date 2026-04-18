package athletes

import "github.com/ubaniak/scoreboard/internal/athletes/entities"

type UseCase interface {
	Create(name, dateOfBirth, nationality string, clubID *uint) error
	List() ([]entities.Athlete, error)
	Get(id uint) (*entities.Athlete, error)
	Update(id uint, toUpdate *entities.UpdateAthlete) error
	Delete(id uint) error
	SetImageUrl(id uint, url string) error
}

type useCase struct {
	storage Storage
}

func NewUseCase(storage Storage) UseCase {
	return &useCase{storage: storage}
}

func (uc *useCase) Create(name, dateOfBirth, nationality string, clubID *uint) error {
	return uc.storage.Create(&entities.Athlete{
		Name:        name,
		DateOfBirth: dateOfBirth,
		Nationality: nationality,
		ClubID:      clubID,
	})
}

func (uc *useCase) List() ([]entities.Athlete, error) {
	return uc.storage.List()
}

func (uc *useCase) Get(id uint) (*entities.Athlete, error) {
	return uc.storage.Get(id)
}

func (uc *useCase) Update(id uint, toUpdate *entities.UpdateAthlete) error {
	return uc.storage.Update(id, toUpdate)
}

func (uc *useCase) Delete(id uint) error {
	return uc.storage.Delete(id)
}

func (uc *useCase) SetImageUrl(id uint, url string) error {
	return uc.storage.SetImageUrl(id, url)
}
