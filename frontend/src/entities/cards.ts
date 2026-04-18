import type { BoutStatus } from "./bouts";

export type CardStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

export type Card = {
  id: string;
  name: string;
  date: string;
  status: CardStatus;
  numberOfJudges: number;
  imageUrl?: string;
};

export type Official = {
  id: string;
  name: string;
  nationality?: string;
  gender?: string;
  yearOfBirth?: number;
  registrationNumber?: string;
};

export type AgeCategory =
  | "juniorA"
  | "juniorB"
  | "juniorC"
  | "youth"
  | "elite"
  | "master";

export type BoutType = "sparring" | "developmental" | "scored";

export type Bout = {
  id: string;
  boutNumber: number;
  redCorner: string;
  blueCorner: string;
  status: BoutStatus;
  ageCategory: AgeCategory;
  gender: "male" | "female";
  experience: "novice" | "open";
  gloveSize: "10oz" | "12oz" | "16oz";
  decision: string;
  winner: string;
  roundLength: number;
  weightClass: number;
  numberOfJudges: number;
  rounds: RoundDetails[];
  comments: string[];
  referee: string;
  boutType: BoutType;
  redAthleteId?: number;
  blueAthleteId?: number;
};

export type RoundStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "waiting_for_results"
  | "score_complete"
  | "complete";

export type Round = {
  roundNumber: number;
  status: RoundStatus;
};

export type RoundDetails = {
  boutId: string;
  roundNumber: number;
  status: RoundStatus;
  decision: string;
  red: {
    warnings: string[];
    cautions: string[];
    eightCounts: number;
  };
  blue: {
    warnings: string[];
    cautions: string[];
    eightCounts: number;
  };
};
