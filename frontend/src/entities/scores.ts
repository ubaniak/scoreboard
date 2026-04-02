export type ScoreStatus = "not_started" | "requested" | "complete";

export type Score = {
  judgeRole: string;
  judgeName?: string;
  red: number;
  blue: number;
  status?: ScoreStatus;
};

export type ScoresByRound = Record<number, Score[]>;
