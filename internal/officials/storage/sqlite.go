package storage

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ubaniak/scoreboard/internal/officials/entities"
)

type Sqlite struct {
	db *gorm.DB
}

// AffiliationRow is a minimal struct for affiliation name lookup.
type AffiliationRow struct {
	ID   uint
	Name string
}

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
	if err := db.AutoMigrate(&Official{}, &CardOfficial{}); err != nil {
		return nil, err
	}

	return &Sqlite{db: db}, nil
}

func (s *Sqlite) resolveAffiliationNames(officials []Official) []entities.Official {
	// Collect distinct affiliation IDs
	affiliationIDSet := map[uint]struct{}{}
	for _, o := range officials {
		if o.ProvinceAffiliationID != nil {
			affiliationIDSet[*o.ProvinceAffiliationID] = struct{}{}
		}
		if o.NationAffiliationID != nil {
			affiliationIDSet[*o.NationAffiliationID] = struct{}{}
		}
		if o.ClubAffiliationID != nil {
			affiliationIDSet[*o.ClubAffiliationID] = struct{}{}
		}
	}

	type affiliationInfo struct {
		name string
	}
	affiliations := map[uint]affiliationInfo{}
	if len(affiliationIDSet) > 0 {
		ids := make([]uint, 0, len(affiliationIDSet))
		for id := range affiliationIDSet {
			ids = append(ids, id)
		}
		var rows []AffiliationRow
		if err := s.db.Table("affiliations").Select("id, name").Where("id IN ? AND deleted_at IS NULL", ids).Find(&rows).Error; err == nil {
			for _, r := range rows {
				affiliations[r.ID] = affiliationInfo{name: r.Name}
			}
		}
	}

	result := make([]entities.Official, len(officials))
	for i, o := range officials {
		e := entities.Official{
			ID:                    o.ID,
			Name:                  o.Name,
			Nationality:           o.Nationality,
			Gender:                o.Gender,
			YearOfBirth:           o.YearOfBirth,
			RegistrationNumber:    o.RegistrationNumber,
			Level:                 entities.OfficialLevel(o.Level),
			ProvinceAffiliationID: o.ProvinceAffiliationID,
			NationAffiliationID:   o.NationAffiliationID,
			ClubAffiliationID:     o.ClubAffiliationID,
		}
		if o.ProvinceAffiliationID != nil {
			if info, ok := affiliations[*o.ProvinceAffiliationID]; ok {
				e.Province = info.name
			}
		}
		if o.NationAffiliationID != nil {
			if info, ok := affiliations[*o.NationAffiliationID]; ok {
				e.Nation = info.name
			}
		}
		if o.ClubAffiliationID != nil {
			if info, ok := affiliations[*o.ClubAffiliationID]; ok {
				e.Club = info.name
			}
		}
		result[i] = e
	}
	return result
}

func (s *Sqlite) Save(official *entities.Official) error {
	if official.ID == 0 {
		o := &Official{
			Name:                  official.Name,
			Nationality:           official.Nationality,
			Gender:                official.Gender,
			YearOfBirth:           official.YearOfBirth,
			RegistrationNumber:    official.RegistrationNumber,
			Level:                 string(official.Level),
			ProvinceAffiliationID: official.ProvinceAffiliationID,
			NationAffiliationID:   official.NationAffiliationID,
			ClubAffiliationID:     official.ClubAffiliationID,
		}
		return s.db.Create(o).Error
	}
	return s.db.Model(&Official{}).
		Where("id = ?", official.ID).
		Updates(map[string]interface{}{
			"name":                    official.Name,
			"nationality":             official.Nationality,
			"gender":                  official.Gender,
			"year_of_birth":           official.YearOfBirth,
			"registration_number":     official.RegistrationNumber,
			"level":                   string(official.Level),
			"province_affiliation_id": official.ProvinceAffiliationID,
			"nation_affiliation_id":   official.NationAffiliationID,
			"club_affiliation_id":     official.ClubAffiliationID,
		}).Error
}

func (s *Sqlite) Get() ([]entities.Official, error) {
	var officials []Official
	if err := s.db.Find(&officials).Error; err != nil {
		return []entities.Official{}, err
	}
	return s.resolveAffiliationNames(officials), nil
}

func (s *Sqlite) FindByName(name string) (*entities.Official, error) {
	var row Official
	if err := s.db.Where("LOWER(name) = LOWER(?)", name).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	results := s.resolveAffiliationNames([]Official{row})
	if len(results) == 0 {
		return nil, nil
	}
	return &results[0], nil
}

func (s *Sqlite) Delete(id uint) error {
	if err := s.db.Where("id = ?", id).Delete(&Official{}).Error; err != nil {
		return err
	}

	return nil
}

// AssignToCard upserts the card↔official roster row: if the pair already
// exists its capability flags are overwritten, otherwise a new row is
// created. This is how capabilities get edited after the initial assignment.
func (s *Sqlite) AssignToCard(cardId, officialId uint, caps entities.CardOfficial) error {
	var existing CardOfficial
	err := s.db.Where("card_id = ? AND official_id = ?", cardId, officialId).First(&existing).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		return s.db.Create(&CardOfficial{
			CardID:       cardId,
			OfficialID:   officialId,
			CanJudge:     caps.CanJudge,
			CanRef:       caps.CanRef,
			CanTimekeep:  caps.CanTimekeep,
			CanSupervise: caps.CanSupervise,
		}).Error
	}
	return s.db.Model(&CardOfficial{}).
		Where("id = ?", existing.ID).
		Updates(map[string]interface{}{
			"can_judge":     caps.CanJudge,
			"can_ref":       caps.CanRef,
			"can_timekeep":  caps.CanTimekeep,
			"can_supervise": caps.CanSupervise,
		}).Error
}

// RemoveFromCard hard-deletes the roster row so the (card_id, official_id)
// pair is free to be re-assigned later without tripping the unique index.
func (s *Sqlite) RemoveFromCard(cardId, officialId uint) error {
	return s.db.Unscoped().
		Where("card_id = ? AND official_id = ?", cardId, officialId).
		Delete(&CardOfficial{}).Error
}

func (s *Sqlite) ListForCard(cardId uint) ([]entities.AssignedOfficial, error) {
	var rows []CardOfficial
	if err := s.db.Where("card_id = ?", cardId).Find(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return []entities.AssignedOfficial{}, nil
	}

	officialIDs := make([]uint, len(rows))
	capsByOfficial := make(map[uint]CardOfficial, len(rows))
	for i, r := range rows {
		officialIDs[i] = r.OfficialID
		capsByOfficial[r.OfficialID] = r
	}

	var officials []Official
	if err := s.db.Where("id IN ?", officialIDs).Find(&officials).Error; err != nil {
		return nil, err
	}
	resolved := s.resolveAffiliationNames(officials)

	result := make([]entities.AssignedOfficial, len(resolved))
	for i, o := range resolved {
		caps := capsByOfficial[o.ID]
		result[i] = entities.AssignedOfficial{
			Official:     o,
			CanJudge:     caps.CanJudge,
			CanRef:       caps.CanRef,
			CanTimekeep:  caps.CanTimekeep,
			CanSupervise: caps.CanSupervise,
		}
	}
	return result, nil
}
