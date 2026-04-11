export type ScoreStatus = "not_started" | "requested" | "ready" | "complete";

export type Score = {
  judgeRole: string;
  judgeName?: string;
  red: number;
  blue: number;
  status?: ScoreStatus;
};

export type ScoresByRound = Record<number, Score[]>;
