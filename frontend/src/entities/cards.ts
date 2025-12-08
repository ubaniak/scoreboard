export type Card = {
  id: string;
  name: string;
  date: string;
  settings: Settings;
};

export type Settings = {
  numberOfJudges: number;
};

export type Official = {
  id?: string;
  name: string;
};
