import type { BoutStatus } from "./bouts";
import type { AgeCategory } from "./cards";

export type Current = {
  card?: {
    name: string;
  };
  bout?: {
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
  round?: {
    roundNumber: number;
    status: string;
  };
};
