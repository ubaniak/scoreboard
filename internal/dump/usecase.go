package dump

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type UseCase interface {
	ExportData() (*exportPayload, error)
	Restore(p *exportPayload) error
	UploadsDir() string
}

type useCase struct {
	db         *gorm.DB
	uploadsDir string
}

func NewUseCase(db *gorm.DB, uploadsDir string) UseCase {
	return &useCase{db: db, uploadsDir: uploadsDir}
}

func (uc *useCase) UploadsDir() string { return uc.uploadsDir }

func (uc *useCase) ExportData() (*exportPayload, error) {
	p := &exportPayload{
		Version:    1,
		ExportedAt: time.Now(),
	}
	for _, q := range []func() error{
		func() error { return uc.db.Find(&p.Affiliations).Error },
		func() error { return uc.db.Find(&p.Clubs).Error },
		func() error { return uc.db.Find(&p.Athletes).Error },
		func() error { return uc.db.Find(&p.Officials).Error },
		func() error { return uc.db.Find(&p.Cards).Error },
		func() error { return uc.db.Find(&p.Bouts).Error },
		func() error { return uc.db.Find(&p.Rounds).Error },
		func() error { return uc.db.Find(&p.RoundFouls).Error },
		func() error { return uc.db.Find(&p.Scores).Error },
	} {
		if err := q(); err != nil {
			return nil, err
		}
	}
	return p, nil
}

func (uc *useCase) Restore(p *exportPayload) error {
	return uc.db.Transaction(func(tx *gorm.DB) error {
		for _, table := range []string{
			"scores", "round_fouls", "rounds", "bouts",
			"officials", "cards", "athletes", "clubs", "affiliations",
		} {
			if err := tx.Exec("DELETE FROM " + table).Error; err != nil {
				return fmt.Errorf("clear %s: %w", table, err)
			}
		}

		for i := range p.Affiliations {
			if err := tx.Create(&p.Affiliations[i]).Error; err != nil {
				return fmt.Errorf("insert affiliation %d: %w", p.Affiliations[i].ID, err)
			}
		}
		for i := range p.Clubs {
			if err := tx.Create(&p.Clubs[i]).Error; err != nil {
				return fmt.Errorf("insert club %d: %w", p.Clubs[i].ID, err)
			}
		}
		for i := range p.Athletes {
			if err := tx.Create(&p.Athletes[i]).Error; err != nil {
				return fmt.Errorf("insert athlete %d: %w", p.Athletes[i].ID, err)
			}
		}
		for i := range p.Officials {
			if err := tx.Create(&p.Officials[i]).Error; err != nil {
				return fmt.Errorf("insert official %d: %w", p.Officials[i].ID, err)
			}
		}
		for i := range p.Cards {
			if err := tx.Create(&p.Cards[i]).Error; err != nil {
				return fmt.Errorf("insert card %d: %w", p.Cards[i].ID, err)
			}
		}
		for i := range p.Bouts {
			if err := tx.Create(&p.Bouts[i]).Error; err != nil {
				return fmt.Errorf("insert bout %d: %w", p.Bouts[i].ID, err)
			}
		}
		for i := range p.Rounds {
			if err := tx.Create(&p.Rounds[i]).Error; err != nil {
				return fmt.Errorf("insert round %d: %w", p.Rounds[i].ID, err)
			}
		}
		for i := range p.RoundFouls {
			if err := tx.Create(&p.RoundFouls[i]).Error; err != nil {
				return fmt.Errorf("insert round_foul %d: %w", p.RoundFouls[i].ID, err)
			}
		}
		for i := range p.Scores {
			if err := tx.Create(&p.Scores[i]).Error; err != nil {
				return fmt.Errorf("insert score: %w", err)
			}
		}

		return nil
	})
}
