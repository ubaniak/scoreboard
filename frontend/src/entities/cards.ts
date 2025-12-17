export type Card = {
  id: string;
  name: string;
  date: string;
  status: string;
  numberOfJudges: number;
};

export type Official = {
  id?: string;
  name: string;
};

type AgeCategory =
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
  status: string;
  ageCategory: AgeCategory;
  gender: "male" | "female";
  experience: "novice" | "open";
  gloveSize: "10oz" | "12oz" | "16oz";
  decision: string;
  roundLength: number;
};
