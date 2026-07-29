import type { Bout } from "../../../entities/cards";

export type BoutFormat = {
  boutType: string;
  roundLength: number;
  gloveSize: string;
};

const FALLBACK_FORMAT: BoutFormat = {
  boutType: "scored",
  roundLength: 1,
  gloveSize: "10oz",
};

export const lastUsedFormat = (bouts?: Bout[]): { format: BoutFormat; source?: number } => {
  if (!bouts || bouts.length === 0) {
    return { format: FALLBACK_FORMAT };
  }
  const latest = bouts.reduce((a, b) => (b.boutNumber > a.boutNumber ? b : a));
  return {
    format: {
      boutType: latest.boutType,
      roundLength: latest.roundLength,
      gloveSize: latest.gloveSize,
    },
    source: latest.boutNumber,
  };
};
