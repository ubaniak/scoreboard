import type { BoutStatus } from "./bouts";
import type { AgeCategory } from "./cards";

type BoutInfo = {
  id: string;
  boutNumber: number;
  boutType: string;
  redCorner: string;
  blueCorner: string;
  status: BoutStatus;
  ageCategory: AgeCategory;
  gender: "male" | "female";
  experience: "novice" | "open";
  gloveSize: "10oz" | "12oz" | "16oz";
  decision?: string;
  winner?: string;
  roundLength: number;
  weightClass: number;
  redClubName?: string;
  blueClubName?: string;
  redAthleteImageUrl?: string;
  blueAthleteImageUrl?: string;
};

export type ScheduleItem = {
  id: string;
  boutNumber: number;
  boutType: string;
  redCorner: string;
  blueCorner: string;
  status: string;
  winner?: string;
  decision?: string;
  weightClass: number;
  gloveSize: string;
  roundLength: number;
  ageCategory: string;
  experience: string;
  redClubName?: string;
  blueClubName?: string;
  redAthleteImageUrl?: string;
  blueAthleteImageUrl?: string;
};

export type Schedule = {
  card?: {
    id: string;
    name: string;
  };
  bouts: ScheduleItem[];
};

export type Current = {
  card?: {
    id: string;
    name: string;
  };
  bout?: BoutInfo;
  nextBout?: BoutInfo;
  round?: {
    roundNumber: number;
    status: string;
  };
  scores?: Record<number, { red: number; blue: number }[]>;
  warnings?: Record<number, { red: number; blue: number }>;
};
