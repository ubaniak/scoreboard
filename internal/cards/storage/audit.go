package storage

import (
	"encoding/json"
	"time"

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
