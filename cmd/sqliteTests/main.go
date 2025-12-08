package main

import (
	"encoding/json"
	"log"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// AuditLog provides embedded audit fields for tracking changes
type AuditLog struct {
	CreatedAt time.Time `gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime"`
	CreatedBy string    `gorm:"size:100"`
	UpdatedBy string    `gorm:"size:100"`
}

// AuditLogEntry stores a complete history of all changes to audited entities
type AuditLogEntry struct {
	gorm.Model
	EntityType string    `gorm:"not null;index;size:100"` // e.g., "Card", "Bout", "Round"
	EntityID   uint      `gorm:"not null;index"`
	Action     string    `gorm:"not null;size:20"` // "create", "update", "delete"
	UserID     string    `gorm:"size:100;index"`
	Changes    string    `gorm:"type:text"` // JSON representation of changes
	Timestamp  time.Time `gorm:"not null;index"`
}

// LogChange creates an audit log entry for any change
func LogChange(db *gorm.DB, entityType string, entityID uint, action string, userID string, changes interface{}) error {
	changesJSON, err := json.Marshal(changes)
	if err != nil {
		return err
	}

	entry := AuditLogEntry{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		UserID:     userID,
		Changes:    string(changesJSON),
		Timestamp:  time.Now(),
	}

	return db.Create(&entry).Error
}

// AuditLogger interface for entities that support audit logging
type AuditLogger interface {
	GetEntityType() string
	GetEntityID() uint
	SetAuditUser(userID string)
	GetAuditUser() string
}

// RegisterAuditHooks registers GORM hooks for automatic audit logging
func RegisterAuditHooks(db *gorm.DB) {
	// Hook for create operations
	db.Callback().Create().After("gorm:create").Register("audit:create", func(tx *gorm.DB) {
		// Check if the destination implements AuditLogger
		dest := tx.Statement.Dest
		if dest == nil {
			return
		}

		// Try to get the auditable interface
		if auditable, ok := dest.(AuditLogger); ok {
			if auditable.GetEntityID() > 0 {
				// Create audit log in a new session to avoid recursion
				LogChange(tx.Session(&gorm.Session{NewDB: true}), auditable.GetEntityType(), auditable.GetEntityID(), "create", auditable.GetAuditUser(), dest)
			}
		}
	})

	// Hook for update operations
	db.Callback().Update().After("gorm:update").Register("audit:update", func(tx *gorm.DB) {
		dest := tx.Statement.Dest
		if dest == nil {
			return
		}

		if auditable, ok := dest.(AuditLogger); ok {
			if auditable.GetEntityID() > 0 {
				LogChange(tx.Session(&gorm.Session{NewDB: true}), auditable.GetEntityType(), auditable.GetEntityID(), "update", auditable.GetAuditUser(), dest)
			}
		}
	})

	// Hook for delete operations
	db.Callback().Delete().After("gorm:delete").Register("audit:delete", func(tx *gorm.DB) {
		dest := tx.Statement.Dest
		if dest == nil {
			return
		}

		if auditable, ok := dest.(AuditLogger); ok {
			if auditable.GetEntityID() > 0 {
				LogChange(tx.Session(&gorm.Session{NewDB: true}), auditable.GetEntityType(), auditable.GetEntityID(), "delete", auditable.GetAuditUser(), dest)
			}
		}
	})
}

// GetAuditHistory retrieves audit history for a specific entity
func GetAuditHistory(db *gorm.DB, entityType string, entityID uint) ([]AuditLogEntry, error) {
	var entries []AuditLogEntry
	err := db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("timestamp desc").
		Find(&entries).Error
	return entries, err
}

type Card struct {
	gorm.Model
	AuditLog
	Name        string  `gorm:"not null"`
	Description string  `gorm:"not null"`
	Judges      []Judge `gorm:"foreignKey:CardID"`
	Bouts       []Bout  `gorm:"foreignKey:CardID"`
	auditUserID string  `gorm:"-"` // Not stored in DB, used for audit logging
}

func (c *Card) GetEntityType() string      { return "Card" }
func (c *Card) GetEntityID() uint          { return c.ID }
func (c *Card) SetAuditUser(userID string) { c.auditUserID = userID }
func (c *Card) GetAuditUser() string       { return c.auditUserID }
func (c *Card) BeforeCreate(tx *gorm.DB) error {
	c.CreatedBy = c.auditUserID
	c.UpdatedBy = c.auditUserID
	return nil
}
func (c *Card) BeforeUpdate(tx *gorm.DB) error {
	c.UpdatedBy = c.auditUserID
	return nil
}

// GetNextReadyBout returns the next bout in Ready state for this card, ordered by bout number
func (c *Card) GetNextReadyBout(db *gorm.DB) (*Bout, error) {
	var bout Bout
	err := db.Where("card_id = ? AND status = ?", c.ID, BoutStatusReady).
		Order("bout_number asc").
		First(&bout).Error

	if err != nil {
		return nil, err
	}

	return &bout, nil
}

// GetAllReadyBouts returns all bouts in Ready state for this card, ordered by bout number
func (c *Card) GetAllReadyBouts(db *gorm.DB) ([]Bout, error) {
	var bouts []Bout
	err := db.Where("card_id = ? AND status = ?", c.ID, BoutStatusReady).
		Order("bout_number asc").
		Find(&bouts).Error

	if err != nil {
		return nil, err
	}

	return bouts, nil
}

// GetBoutByNumber returns a specific bout by its number for this card
func (c *Card) GetBoutByNumber(db *gorm.DB, boutNumber int) (*Bout, error) {
	var bout Bout
	err := db.Where("card_id = ? AND bout_number = ?", c.ID, boutNumber).
		First(&bout).Error

	if err != nil {
		return nil, err
	}

	return &bout, nil
}

type Settings struct {
	gorm.Model
	AuditLog
	CardID         uint   `gorm:"not null"`
	Card           Card   `gorm:"foreignKey:CardID"`
	NumberOfJudges int    `gorm:"not null"`
	auditUserID    string `gorm:"-"`
}

func (s *Settings) GetEntityType() string      { return "Settings" }
func (s *Settings) GetEntityID() uint          { return s.ID }
func (s *Settings) SetAuditUser(userID string) { s.auditUserID = userID }
func (s *Settings) GetAuditUser() string       { return s.auditUserID }
func (s *Settings) BeforeCreate(tx *gorm.DB) error {
	s.CreatedBy = s.auditUserID
	s.UpdatedBy = s.auditUserID
	return nil
}
func (s *Settings) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedBy = s.auditUserID
	return nil
}

type Judge struct {
	gorm.Model
	AuditLog
	CardID      uint    `gorm:"not null"`
	Card        Card    `gorm:"foreignKey:CardID"`
	Name        string  `gorm:"not null"`
	Scores      []Score `gorm:"foreignKey:JudgeID"`
	auditUserID string  `gorm:"-"`
}

func (j *Judge) GetEntityType() string      { return "Judge" }
func (j *Judge) GetEntityID() uint          { return j.ID }
func (j *Judge) SetAuditUser(userID string) { j.auditUserID = userID }
func (j *Judge) GetAuditUser() string       { return j.auditUserID }
func (j *Judge) BeforeCreate(tx *gorm.DB) error {
	j.CreatedBy = j.auditUserID
	j.UpdatedBy = j.auditUserID
	return nil
}
func (j *Judge) BeforeUpdate(tx *gorm.DB) error {
	j.UpdatedBy = j.auditUserID
	return nil
}

type BoutStatus string

const (
	BoutStatusNotStarted       BoutStatus = "not_started"
	BoutStatusReady            BoutStatus = "ready"
	BoutStatusInProgress       BoutStatus = "in_progress"
	BoutStatusWaitingForResult BoutStatus = "waiting_for_result"
	BoutStatusCompleted        BoutStatus = "completed"
	BoutStatusCancelled        BoutStatus = "cancelled"
)

type ScoreStatus string

const (
	ScoreStatusReady    ScoreStatus = "ready"
	ScoreStatusScoring  ScoreStatus = "scoring"
	ScoreStatusComplete ScoreStatus = "complete"
)

type Experience string

const (
	Novice Experience = "novice"
	Open   Experience = "open"
)

type AgeCategory string

const (
	JuniorA AgeCategory = "juniorA"
	JuniorB AgeCategory = "juniorB"
	JuniorC AgeCategory = "juniorC"
	Youth   AgeCategory = "youth"
	Elite   AgeCategory = "elite"
	Masters AgeCategory = "masters"
)

type GloveSize string

const (
	TenOz     GloveSize = "10oz"
	TwelveOz  GloveSize = "12oz"
	SixteenOz GloveSize = "16oz"
)

type RoundLength float64

const (
	ThreeMinutes  RoundLength = 3.0
	TwoMinutes    RoundLength = 2.0
	OneMinute     RoundLength = 1.0
	OneHalfMinute RoundLength = 1.5
)

type Bout struct {
	gorm.Model
	AuditLog
	CardID             uint        `gorm:"not null"`
	Card               Card        `gorm:"foreignKey:CardID"`
	BoutNumber         int         `gorm:"not null"`
	RedCorner          string      `gorm:"not null"`
	BlueCorner         string      `gorm:"not null"`
	WeightClass        string      `gorm:"not null"`
	GloveSize          GloveSize   `gorm:"not null"`
	RoundLength        RoundLength `gorm:"not null"`
	AgeCategory        AgeCategory `gorm:"not null"`
	Experience         Experience  `gorm:"not null"`
	RedCornerImageUrl  string
	BlueCornerImageUrl string
	Rounds             []Round    `gorm:"foreignKey:BoutID"`
	Stoppage           *Stoppage  `gorm:"foreignKey:BoutID"` // Only one stoppage allowed per bout
	Status             BoutStatus `gorm:"not null"`
	Decision           string     `gorm:"not null"`
	auditUserID        string     `gorm:"-"`
}

func (b *Bout) GetEntityType() string      { return "Bout" }
func (b *Bout) GetEntityID() uint          { return b.ID }
func (b *Bout) SetAuditUser(userID string) { b.auditUserID = userID }
func (b *Bout) GetAuditUser() string       { return b.auditUserID }
func (b *Bout) BeforeCreate(tx *gorm.DB) error {
	b.CreatedBy = b.auditUserID
	b.UpdatedBy = b.auditUserID
	return nil
}
func (b *Bout) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedBy = b.auditUserID
	return nil
}

// AddStoppage records or updates the stoppage for this bout (only one allowed)
// When a stoppage is added, the bout is automatically marked as completed
func (b *Bout) AddStoppage(db *gorm.DB, roundNumber int, corner Corner, reason StoppageReason, userID string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Check if stoppage already exists for this bout
		var existing Stoppage
		err := tx.Where("bout_id = ?", b.ID).First(&existing).Error

		if err == nil {
			// Stoppage exists, update it
			existing.RoundNumber = roundNumber
			existing.Corner = corner
			existing.Reason = reason
			existing.Timestamp = time.Now()
			existing.SetAuditUser(userID)
			if err := tx.Save(&existing).Error; err != nil {
				return err
			}
		} else {
			// No existing stoppage, create new one
			stoppage := Stoppage{
				BoutID:      b.ID,
				RoundNumber: roundNumber,
				Corner:      corner,
				Reason:      reason,
				Timestamp:   time.Now(),
			}
			stoppage.SetAuditUser(userID)
			if err := tx.Create(&stoppage).Error; err != nil {
				return err
			}
		}

		// Mark the bout as completed since a stoppage occurred
		b.Status = BoutStatusCompleted
		b.SetAuditUser(userID)
		if err := tx.Save(b).Error; err != nil {
			return err
		}

		return nil
	})
}

// GetStoppage returns the stoppage for this bout if one exists
func (b *Bout) GetStoppage(db *gorm.DB) (*Stoppage, error) {
	var stoppage Stoppage
	err := db.Where("bout_id = ?", b.ID).First(&stoppage).Error
	if err != nil {
		return nil, err
	}
	return &stoppage, nil
}

// HasStoppage returns true if this bout has a stoppage recorded
func (b *Bout) HasStoppage() bool {
	return b.Stoppage != nil
}

// RemoveStoppage deletes the stoppage for this bout
func (b *Bout) RemoveStoppage(db *gorm.DB) error {
	return db.Where("bout_id = ?", b.ID).Delete(&Stoppage{}).Error
}

type BoutResult struct {
	RedTotalScore  int
	BlueTotalScore int
	Winner         Corner
	IsDraw         bool
	RoundScores    []RoundScore
}

type RoundScore struct {
	RoundNumber int
	RedScore    int
	BlueScore   int
}

// CalculateOverallWinner sums scores across all rounds and determines the winner
func (b *Bout) CalculateOverallWinner() BoutResult {
	redTotal := 0
	blueTotal := 0
	roundScores := make([]RoundScore, 0, len(b.Rounds))

	// Sum up scores from all rounds
	for _, round := range b.Rounds {
		redScore, blueScore := round.CalculateScores()
		redTotal += redScore
		blueTotal += blueScore

		roundScores = append(roundScores, RoundScore{
			RoundNumber: round.RoundNumber,
			RedScore:    redScore,
			BlueScore:   blueScore,
		})
	}

	result := BoutResult{
		RedTotalScore:  redTotal,
		BlueTotalScore: blueTotal,
		RoundScores:    roundScores,
	}

	// Determine winner
	if redTotal > blueTotal {
		result.Winner = RedCornerType
	} else if blueTotal > redTotal {
		result.Winner = BlueCornerType
	} else {
		result.IsDraw = true
	}

	return result
}

// GetNextReadyBoutAnyCard returns the next bout in Ready state across all cards
func GetNextReadyBoutAnyCard(db *gorm.DB) (*Bout, error) {
	var bout Bout
	err := db.Where("status = ?", BoutStatusReady).
		Order("card_id asc, bout_number asc").
		First(&bout).Error

	if err != nil {
		return nil, err
	}

	return &bout, nil
}

type Round struct {
	gorm.Model
	AuditLog
	Status          BoutStatus `gorm:"not null"`
	BoutID          uint       `gorm:"not null"`
	Bout            Bout       `gorm:"foreignKey:BoutID"`
	RoundNumber     int        `gorm:"not null"`
	StartTime       time.Time  `gorm:"not null"`
	EndTime         time.Time  `gorm:"not null"`
	Scores          []Score    `gorm:"foreignKey:RoundID"`
	RedEightCounts  int        `gorm:"not null"`
	BlueEightCounts int        `gorm:"not null"`
	RedWarnings     int        `gorm:"not null"`
	BlueWarnings    int        `gorm:"not null"`
	Cautions        []Cautions `gorm:"foreignKey:RoundID"`
	auditUserID     string     `gorm:"-"`
}

func (r *Round) GetEntityType() string      { return "Round" }
func (r *Round) GetEntityID() uint          { return r.ID }
func (r *Round) SetAuditUser(userID string) { r.auditUserID = userID }
func (r *Round) GetAuditUser() string       { return r.auditUserID }
func (r *Round) BeforeCreate(tx *gorm.DB) error {
	r.CreatedBy = r.auditUserID
	r.UpdatedBy = r.auditUserID
	return nil
}
func (r *Round) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedBy = r.auditUserID
	return nil
}

func (r *Round) AddRedEightCount() {
	r.RedEightCounts++
}

func (r *Round) AddBlueEightCount() {
	r.BlueEightCounts++
}

func (r *Round) AddRedWarning() {
	r.RedWarnings++
}

func (r *Round) AddBlueWarning() {
	r.BlueWarnings++
}

func (r *Round) CalculateScores() (redScore int, blueScore int) {
	redTotal := 0
	blueTotal := 0

	// Sum up all judge scores
	for _, score := range r.Scores {
		redTotal += score.RedCornerScore
		blueTotal += score.BlueCornerScore
	}

	// Deduct warnings
	redScore = redTotal - r.RedWarnings
	blueScore = blueTotal - r.BlueWarnings

	return redScore, blueScore
}

func (r *Round) GetRedCautions() []Cautions {
	var redCautions []Cautions
	for _, caution := range r.Cautions {
		if caution.Corner == RedCornerType {
			redCautions = append(redCautions, caution)
		}
	}
	return redCautions
}

func (r *Round) GetBlueCautions() []Cautions {
	var blueCautions []Cautions
	for _, caution := range r.Cautions {
		if caution.Corner == BlueCornerType {
			blueCautions = append(blueCautions, caution)
		}
	}
	return blueCautions
}

func (r *Round) AddRedCaution(db *gorm.DB, cautionTypeID uint) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create the caution instance
		caution := Cautions{
			RoundID:       r.ID,
			CautionTypeID: cautionTypeID,
			Corner:        RedCornerType,
			Timestamp:     time.Now(),
		}
		if err := tx.Create(&caution).Error; err != nil {
			return err
		}

		// Increment global count on CautionType
		return tx.Model(&CautionType{}).Where("id = ?", cautionTypeID).
			UpdateColumn("global_count", gorm.Expr("global_count + ?", 1)).Error
	})
}

func (r *Round) AddBlueCaution(db *gorm.DB, cautionTypeID uint) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create the caution instance
		caution := Cautions{
			RoundID:       r.ID,
			CautionTypeID: cautionTypeID,
			Corner:        BlueCornerType,
			Timestamp:     time.Now(),
		}
		if err := tx.Create(&caution).Error; err != nil {
			return err
		}

		// Increment global count on CautionType
		return tx.Model(&CautionType{}).Where("id = ?", cautionTypeID).
			UpdateColumn("global_count", gorm.Expr("global_count + ?", 1)).Error
	})
}

type Corner string

const (
	RedCornerType  Corner = "red"
	BlueCornerType Corner = "blue"
)

type StoppageReason string

const (
	StoppageRSC  StoppageReason = "RSC"   // Referee Stopped Contest
	StoppageRSCI StoppageReason = "RSC-I" // Referee Stopped Contest - Injury
	StoppageTKO  StoppageReason = "TKO"   // Technical Knockout
	StoppageABD  StoppageReason = "ABD"   // Abandoned
	StoppageDQ   StoppageReason = "DQ"    // Disqualification
	StoppageNC   StoppageReason = "NC"    // No Contest
	StoppageMD   StoppageReason = "MD"    // Medical Disqualification
)

type Stoppage struct {
	gorm.Model
	AuditLog
	BoutID      uint           `gorm:"not null;uniqueIndex"` // Only one stoppage per bout
	Bout        Bout           `gorm:"foreignKey:BoutID"`
	RoundNumber int            `gorm:"not null"`
	Corner      Corner         `gorm:"not null"`
	Reason      StoppageReason `gorm:"not null;size:10"`
	Timestamp   time.Time      `gorm:"not null"`
	auditUserID string         `gorm:"-"`
}

func (s *Stoppage) GetEntityType() string      { return "Stoppage" }
func (s *Stoppage) GetEntityID() uint          { return s.ID }
func (s *Stoppage) SetAuditUser(userID string) { s.auditUserID = userID }
func (s *Stoppage) GetAuditUser() string       { return s.auditUserID }
func (s *Stoppage) BeforeCreate(tx *gorm.DB) error {
	s.CreatedBy = s.auditUserID
	s.UpdatedBy = s.auditUserID
	return nil
}
func (s *Stoppage) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedBy = s.auditUserID
	return nil
}

type CautionType struct {
	gorm.Model
	AuditLog
	Name        string     `gorm:"not null;unique"`
	GlobalCount int        `gorm:"not null;default:0"`
	Cautions    []Cautions `gorm:"foreignKey:CautionTypeID"`
	auditUserID string     `gorm:"-"`
}

func (ct *CautionType) GetEntityType() string      { return "CautionType" }
func (ct *CautionType) GetEntityID() uint          { return ct.ID }
func (ct *CautionType) SetAuditUser(userID string) { ct.auditUserID = userID }
func (ct *CautionType) GetAuditUser() string       { return ct.auditUserID }
func (ct *CautionType) BeforeCreate(tx *gorm.DB) error {
	ct.CreatedBy = ct.auditUserID
	ct.UpdatedBy = ct.auditUserID
	return nil
}
func (ct *CautionType) BeforeUpdate(tx *gorm.DB) error {
	ct.UpdatedBy = ct.auditUserID
	return nil
}

type Cautions struct {
	gorm.Model
	AuditLog
	RoundID       uint        `gorm:"not null"`
	Round         Round       `gorm:"foreignKey:RoundID"`
	CautionTypeID uint        `gorm:"not null"`
	CautionType   CautionType `gorm:"foreignKey:CautionTypeID"`
	Corner        Corner      `gorm:"not null"`
	Timestamp     time.Time   `gorm:"not null"`
	auditUserID   string      `gorm:"-"`
}

func (c *Cautions) GetEntityType() string      { return "Cautions" }
func (c *Cautions) GetEntityID() uint          { return c.ID }
func (c *Cautions) SetAuditUser(userID string) { c.auditUserID = userID }
func (c *Cautions) GetAuditUser() string       { return c.auditUserID }
func (c *Cautions) BeforeCreate(tx *gorm.DB) error {
	c.CreatedBy = c.auditUserID
	c.UpdatedBy = c.auditUserID
	return nil
}
func (c *Cautions) BeforeUpdate(tx *gorm.DB) error {
	c.UpdatedBy = c.auditUserID
	return nil
}

type Score struct {
	gorm.Model
	AuditLog
	Status          ScoreStatus `gorm:"not null"`
	RoundID         uint        `gorm:"not null"`
	Round           Round       `gorm:"foreignKey:RoundID"`
	JudgeID         uint        `gorm:"not null"`
	Judge           Judge       `gorm:"foreignKey:JudgeID"`
	RedCornerScore  int         `gorm:"not null"`
	BlueCornerScore int         `gorm:"not null"`
	auditUserID     string      `gorm:"-"`
}

func (s *Score) GetEntityType() string      { return "Score" }
func (s *Score) GetEntityID() uint          { return s.ID }
func (s *Score) SetAuditUser(userID string) { s.auditUserID = userID }
func (s *Score) GetAuditUser() string       { return s.auditUserID }
func (s *Score) BeforeCreate(tx *gorm.DB) error {
	s.CreatedBy = s.auditUserID
	s.UpdatedBy = s.auditUserID
	return nil
}
func (s *Score) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedBy = s.auditUserID
	return nil
}

// StartScoring transitions the score to scoring status
func (s *Score) StartScoring() {
	s.Status = ScoreStatusScoring
}

// CompleteScoring transitions the score to complete status
func (s *Score) CompleteScoring() {
	s.Status = ScoreStatusComplete
}

// IsComplete returns true if the score is complete
func (s *Score) IsComplete() bool {
	return s.Status == ScoreStatusComplete
}

// IsScoring returns true if the score is currently being scored
func (s *Score) IsScoring() bool {
	return s.Status == ScoreStatusScoring
}

// IsReady returns true if the score is ready to be scored
func (s *Score) IsReady() bool {
	return s.Status == ScoreStatusReady
}

func main() {
	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// Auto-migrate all tables
	db.AutoMigrate(&Card{})
	db.AutoMigrate(&Judge{})
	db.AutoMigrate(&Bout{})
	db.AutoMigrate(&Round{})
	db.AutoMigrate(&Score{})
	db.AutoMigrate(&CautionType{})
	db.AutoMigrate(&Cautions{})
	db.AutoMigrate(&Stoppage{})
	db.AutoMigrate(&AuditLogEntry{})

	// Register audit hooks for automatic logging
	RegisterAuditHooks(db)

	card := Card{
		Name:        "Card 1",
		Description: "Description 1",
	}
	card.SetAuditUser("Supervisor")
	db.Create(&card)

	judge := Judge{
		CardID: card.ID,
		Name:   "Judge 1",
	}
	judge.SetAuditUser("Judge 1")
	db.Create(&judge)

	// Create multiple bouts with different statuses
	bout1 := Bout{
		CardID:      card.ID,
		BoutNumber:  1,
		RedCorner:   "Fighter A",
		BlueCorner:  "Fighter B",
		WeightClass: "40kg",
		GloveSize:   TenOz,
		RoundLength: ThreeMinutes,
		AgeCategory: Elite,
		Experience:  Open,
		Status:      BoutStatusCompleted,
		Decision:    "Red Corner by Decision",
	}
	bout1.SetAuditUser("Supervisor")
	db.Create(&bout1)

	bout2 := Bout{
		CardID:      card.ID,
		BoutNumber:  2,
		RedCorner:   "Fighter C",
		BlueCorner:  "Fighter D",
		WeightClass: "45kg",
		GloveSize:   TenOz,
		RoundLength: ThreeMinutes,
		AgeCategory: Elite,
		Experience:  Open,
		Status:      BoutStatusReady,
		Decision:    "",
	}
	bout2.SetAuditUser("Supervisor")
	db.Create(&bout2)

	bout3 := Bout{
		CardID:      card.ID,
		BoutNumber:  3,
		RedCorner:   "Fighter E",
		BlueCorner:  "Fighter F",
		WeightClass: "50kg",
		GloveSize:   TenOz,
		RoundLength: ThreeMinutes,
		AgeCategory: Elite,
		Experience:  Open,
		Status:      BoutStatusReady,
		Decision:    "",
	}
	bout3.SetAuditUser("Supervisor")
	db.Create(&bout3)

	bout4 := Bout{
		CardID:      card.ID,
		BoutNumber:  4,
		RedCorner:   "Fighter G",
		BlueCorner:  "Fighter H",
		WeightClass: "55kg",
		GloveSize:   TenOz,
		RoundLength: ThreeMinutes,
		AgeCategory: Elite,
		Experience:  Open,
		Status:      BoutStatusNotStarted,
		Decision:    "",
	}
	bout4.SetAuditUser("Supervisor")
	db.Create(&bout4)

	// Use bout2 for the rest of the example
	bout := bout2

	// Create master list of caution types
	cautionTypes := []CautionType{
		{Name: "Low Blow", GlobalCount: 0},
		{Name: "Holding", GlobalCount: 0},
		{Name: "Headbutt", GlobalCount: 0},
		{Name: "Illegal Punch", GlobalCount: 0},
		{Name: "Excessive Clinching", GlobalCount: 0},
	}
	for i := range cautionTypes {
		cautionTypes[i].SetAuditUser("Supervisor")
		db.Create(&cautionTypes[i])
	}

	// Demonstrate GetNextReadyBout method on Card
	log.Println("\n=== Get Next Ready Bout ===")
	nextBout, err := card.GetNextReadyBout(db)
	if err != nil {
		log.Printf("Error getting next ready bout: %v", err)
	} else {
		log.Printf("Next Ready Bout: #%d - %s vs %s (Status: %s)",
			nextBout.BoutNumber,
			nextBout.RedCorner,
			nextBout.BlueCorner,
			nextBout.Status)
	}

	// Example: Create a round and add cautions
	round := Round{
		BoutID:          bout.ID,
		RoundNumber:     1,
		Status:          BoutStatusReady,
		StartTime:       time.Now(),
		EndTime:         time.Now().Add(3 * time.Minute),
		RedEightCounts:  0,
		BlueEightCounts: 0,
		RedWarnings:     0,
		BlueWarnings:    0,
	}
	round.SetAuditUser("Referee")
	db.Create(&round)

	// Get caution types
	var holding, headbutt, lowBlow CautionType
	db.Where("name = ?", "Holding").First(&holding)
	db.Where("name = ?", "Headbutt").First(&headbutt)
	db.Where("name = ?", "Low Blow").First(&lowBlow)

	// Add cautions to red corner
	round.AddRedCaution(db, holding.ID)
	round.AddRedCaution(db, headbutt.ID)

	// Add cautions to blue corner
	round.AddBlueCaution(db, lowBlow.ID)
	round.AddBlueCaution(db, holding.ID) // Blue also gets a holding caution

	// Load round with cautions and their types
	db.Preload("Cautions.CautionType").First(&round, round.ID)

	// Get red and blue cautions separately
	redCautions := round.GetRedCautions()
	blueCautions := round.GetBlueCautions()

	log.Printf("Red cautions: %d", len(redCautions))
	for _, c := range redCautions {
		log.Printf("  - %s (at %s)", c.CautionType.Name, c.Timestamp.Format(time.RFC3339))
	}

	log.Printf("Blue cautions: %d", len(blueCautions))
	for _, c := range blueCautions {
		log.Printf("  - %s (at %s)", c.CautionType.Name, c.Timestamp.Format(time.RFC3339))
	}

	// Add stoppage to the bout (only one allowed per bout)
	log.Println("\n=== Recording Stoppage ===")
	log.Printf("Bout #%d status before stoppage: %s", bout2.BoutNumber, bout2.Status)

	// Add initial stoppage - this will automatically mark the bout as complete
	// Using RSC-I (Referee Stopped Contest - Injury) reason
	err = bout2.AddStoppage(db, 2, BlueCornerType, StoppageRSCI, "Referee")
	if err != nil {
		log.Printf("Error adding stoppage: %v", err)
	} else {
		log.Printf("Stoppage added to Bout #%d", bout2.BoutNumber)
	}

	// Load bout with stoppage to see the status change
	db.Preload("Stoppage").First(&bout2, bout2.ID)

	log.Printf("Bout #%d status after stoppage: %s", bout2.BoutNumber, bout2.Status)

	if bout2.HasStoppage() {
		log.Printf("\nBout #%d Stoppage Details:", bout2.BoutNumber)
		log.Printf("  Round %d - %s corner: %s (at %s)",
			bout2.Stoppage.RoundNumber,
			bout2.Stoppage.Corner,
			bout2.Stoppage.Reason,
			bout2.Stoppage.Timestamp.Format("15:04:05"))
		log.Printf("  Bout Status: %s (automatically set to completed)", bout2.Status)
	} else {
		log.Printf("Bout #%d has no stoppage", bout2.BoutNumber)
	}

	// Demonstrate GetStoppage method
	stoppage, err := bout2.GetStoppage(db)
	if err != nil {
		log.Printf("\nNo stoppage found for bout #%d", bout2.BoutNumber)
	} else {
		log.Printf("\nRetrieved stoppage via GetStoppage():")
		log.Printf("  Round %d, %s corner: %s",
			stoppage.RoundNumber,
			stoppage.Corner,
			stoppage.Reason)
	}

	// Show all available stoppage reasons
	log.Println("\n=== Available Stoppage Reasons ===")
	log.Printf("  RSC   - Referee Stopped Contest")
	log.Printf("  RSC-I - Referee Stopped Contest - Injury")
	log.Printf("  KD    - Knockout/Knockdown")
	log.Printf("  ABD   - Abandoned")

	// Check global counts
	db.First(&holding, holding.ID)
	db.First(&lowBlow, lowBlow.ID)
	db.First(&headbutt, headbutt.ID)

	log.Printf("\nGlobal caution counts:")
	log.Printf("  Holding: %d", holding.GlobalCount)
	log.Printf("  Headbutt: %d", headbutt.GlobalCount)
	log.Printf("  Low Blow: %d", lowBlow.GlobalCount)

	// Example: Add scores from judges
	// Start with a ready score
	score1 := Score{
		Status:          ScoreStatusReady,
		RoundID:         round.ID,
		JudgeID:         judge.ID,
		RedCornerScore:  0,
		BlueCornerScore: 0,
	}
	score1.SetAuditUser("Judge 1")
	db.Create(&score1)

	// Transition to scoring
	log.Printf("\nScore Status: %s (IsReady: %v)", score1.Status, score1.IsReady())
	score1.StartScoring()
	log.Printf("Score Status: %s (IsScoring: %v)", score1.Status, score1.IsScoring())

	// Add scores
	score1.RedCornerScore = 10
	score1.BlueCornerScore = 9
	score1.SetAuditUser("Judge 1")
	db.Save(&score1)

	// Complete scoring
	score1.CompleteScoring()
	score1.SetAuditUser("Judge 1")
	db.Save(&score1)
	log.Printf("Score Status: %s (IsComplete: %v)", score1.Status, score1.IsComplete())

	// Add warnings
	round.AddRedWarning()
	round.AddBlueWarning()
	round.AddBlueWarning() // Blue gets 2 warnings
	round.SetAuditUser("Referee")
	db.Save(&round)

	// Load round with scores
	db.Preload("Scores").First(&round, round.ID)

	// Calculate final scores (with warnings deducted)
	redScore, blueScore := round.CalculateScores()
	log.Printf("\nRound %d Scores:", round.RoundNumber)
	log.Printf("  Red Corner:  %d (warnings: %d)", redScore, round.RedWarnings)
	log.Printf("  Blue Corner: %d (warnings: %d)", blueScore, round.BlueWarnings)
	// Load bout with all rounds and their scores
	db.Preload("Rounds.Scores").First(&bout, bout.ID)

	boutResult := bout.CalculateOverallWinner()
	log.Printf("Bout %d Results:", bout.BoutNumber)
	log.Printf("Red Corner Total:  %d", boutResult.RedTotalScore)
	log.Printf("Blue Corner Total: %d", boutResult.BlueTotalScore)

	if boutResult.IsDraw {
		log.Println("Result: DRAW")
	} else {
		log.Printf("Winner: %s", boutResult.Winner)
	}

	// Demonstrate audit logging
	log.Println("\n=== Audit Log Demonstration ===")

	// Get audit history for the card
	cardAuditHistory, err := GetAuditHistory(db, "Card", card.ID)
	if err != nil {
		log.Printf("Error getting card audit history: %v", err)
	} else {
		log.Printf("\nAudit History for Card ID %d:", card.ID)
		for _, entry := range cardAuditHistory {
			log.Printf("  [%s] %s by %s at %s",
				entry.Action,
				entry.EntityType,
				entry.UserID,
				entry.Timestamp.Format(time.RFC3339))
		}
	}

	// Get audit history for the round
	roundAuditHistory, err := GetAuditHistory(db, "Round", round.ID)
	if err != nil {
		log.Printf("Error getting round audit history: %v", err)
	} else {
		log.Printf("\nAudit History for Round ID %d:", round.ID)
		for _, entry := range roundAuditHistory {
			log.Printf("  [%s] %s by %s at %s",
				entry.Action,
				entry.EntityType,
				entry.UserID,
				entry.Timestamp.Format(time.RFC3339))
		}
	}

	// Demonstrate bout status transitions
	log.Println("\n=== Bout Status Management ===")

	// Mark the current ready bout as in progress
	nextBout.Status = BoutStatusInProgress
	nextBout.SetAuditUser("Supervisor")
	db.Save(nextBout)
	log.Printf("Bout #%d marked as In Progress", nextBout.BoutNumber)

	// Get the next ready bout (should be bout #3 now)
	nextReadyBout, err := card.GetNextReadyBout(db)
	if err != nil {
		log.Printf("Error getting next ready bout: %v", err)
	} else {
		log.Printf("Next Ready Bout is now: #%d - %s vs %s",
			nextReadyBout.BoutNumber,
			nextReadyBout.RedCorner,
			nextReadyBout.BlueCorner)
	}

	// Try getting any ready bout across all cards
	anyReadyBout, err := GetNextReadyBoutAnyCard(db)
	if err != nil {
		log.Printf("No ready bouts found across any cards")
	} else {
		log.Printf("Next Ready Bout (any card): Card %d, Bout #%d - %s vs %s",
			anyReadyBout.CardID,
			anyReadyBout.BoutNumber,
			anyReadyBout.RedCorner,
			anyReadyBout.BlueCorner)
	}

	// Update card to demonstrate update logging
	log.Println("\n=== Testing Update Audit Logging ===")
	card.Description = "Updated description"
	card.SetAuditUser("admin@example.com")
	db.Save(&card)

	// Get updated audit history
	cardAuditHistory, _ = GetAuditHistory(db, "Card", card.ID)
	log.Printf("\nUpdated Audit History for Card ID %d:", card.ID)
	for _, entry := range cardAuditHistory {
		log.Printf("  [%s] %s by %s at %s",
			entry.Action,
			entry.EntityType,
			entry.UserID,
			entry.Timestamp.Format(time.RFC3339))
	}

	// Show all audit log entries
	var allEntries []AuditLogEntry
	db.Order("timestamp desc").Limit(20).Find(&allEntries)
	log.Printf("\nRecent Audit Log Entries (last 20):")
	for _, entry := range allEntries {
		log.Printf("  %s - %s[%d] by %s at %s",
			entry.Action,
			entry.EntityType,
			entry.EntityID,
			entry.UserID,
			entry.Timestamp.Format(time.RFC3339))
	}
}
