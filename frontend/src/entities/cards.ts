import type { BoutStatus } from "./bouts";

export type CardStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

export type Card = {
  id: string;
  name: string;
  date: string;
  status: CardStatus;
  numberOfJudges: number;
};

export type Official = {
  id: string;
  name: string;
};

export type AgeCategory =
  | "juniorA"
  | "juniorB"
  | "juniorC"
  | "youth"
  | "elite"
  | "master";

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
  roundLength: number;
  weightClass: number;
};

export type RoundStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "waiting_for_results"
  | "complete";

export type Round = {
  roundNumber: number;
  status: RoundStatus;
};

export type RoundDetails = {
  boutId: string;
  roundNumber: number;
  status: string;
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
