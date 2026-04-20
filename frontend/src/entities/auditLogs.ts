export type AuditLog = {
  id: number;
  createdAt: string; // RFC3339
  cardId: number;
  boutId?: number;
  roundNumber?: number;
  actorRole: string;
  actorName?: string;
  action: string;
  summary: string;
  metadata: string;
};

