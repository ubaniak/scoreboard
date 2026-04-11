export type BoutStatus =
  | "not_started"
  | "in_progress"
  | "waiting_for_scores"
  | "score_complete"
  | "waiting_for_decision"
  | "decision_made"
  | "completed"
  | "cancelled";

export type RoundStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "waiting_for_results"
  | "complete";
