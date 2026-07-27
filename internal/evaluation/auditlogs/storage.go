package auditlogs

import "github.com/ubaniak/scoreboard/internal/evaluation/auditlogs/entities"

type Storage interface {
	Create(e *entities.AuditLog) error
	ListByCard(cardId uint) ([]*entities.AuditLog, error)
}

