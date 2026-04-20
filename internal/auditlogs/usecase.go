package auditlogs

import (
	"context"
	"encoding/json"
	"time"

	"github.com/ubaniak/scoreboard/internal/auditlogs/entities"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type UseCase interface {
	Log(ctx context.Context, entry LogEntry) error
	List(cardId uint) ([]*entities.AuditLog, error)
}

type LogEntry struct {
	CardID uint

	BoutID      *uint
	RoundNumber *int

	Action       string
	HumanSummary string
	Metadata     any

	// Optional override for actor name (e.g. judge name from request body).
	ActorName *string
}

type usecase struct {
	storage Storage
	now     func() time.Time
}

func NewUseCase(storage Storage) UseCase {
	return &usecase{storage: storage, now: time.Now}
}

func (u *usecase) Log(ctx context.Context, entry LogEntry) error {
	role, ok := rbac.GetRoleFromCtx(ctx)
	if !ok || role == "" {
		role = "unknown"
	}

	var metadataJSON string
	if entry.Metadata != nil {
		if b, err := json.Marshal(entry.Metadata); err == nil {
			metadataJSON = string(b)
		}
	}

	return u.storage.Create(&entities.AuditLog{
		CreatedAt:    u.now(),
		CardID:       entry.CardID,
		BoutID:       entry.BoutID,
		RoundNumber:  entry.RoundNumber,
		ActorRole:    role,
		ActorName:    entry.ActorName,
		Action:       entry.Action,
		HumanSummary: entry.HumanSummary,
		MetadataJSON: metadataJSON,
	})
}

func (u *usecase) List(cardId uint) ([]*entities.AuditLog, error) {
	return u.storage.ListByCard(cardId)
}

