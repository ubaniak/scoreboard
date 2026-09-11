import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";

export type AutoDecision = {
  winner: "red" | "blue";
  decision: "ud" | "sd";
};

/**
 * Suggests a winner + decision type from judges' totals — unanimous when
 * every judge scored the same corner ahead, split otherwise. Returns
 * undefined when there's nothing to score yet, or a judge card is tied
 * (too ambiguous to guess).
 */
export const getAutoDecision = (
  scores?: ScoresByRound,
  rounds?: RoundDetails[],
): AutoDecision | undefined => {
  if (!scores) return undefined;

  const ROUNDS = rounds && rounds.length > 0 ? rounds.map((r) => r.roundNumber) : [1, 2, 3];

  const judgeRoles: string[] = [];
  for (const round of ROUNDS) {
    for (const s of scores[round] ?? []) {
      if (!judgeRoles.includes(s.judgeRole)) judgeRoles.push(s.judgeRole);
    }
  }
  if (judgeRoles.length === 0) return undefined;

  let totalRedWarn = 0;
  let totalBlueWarn = 0;
  for (const round of ROUNDS) {
    const rd = rounds?.find((r) => r.roundNumber === round);
    totalRedWarn += rd?.red.warnings.length ?? 0;
    totalBlueWarn += rd?.blue.warnings.length ?? 0;
  }

  let redPicks = 0;
  let bluePicks = 0;
  for (const role of judgeRoles) {
    const redSum = ROUNDS.reduce(
      (s, r) => s + ((scores[r] ?? []).find((sc) => sc.judgeRole === role)?.red ?? 0),
      0,
    );
    const blueSum = ROUNDS.reduce(
      (s, r) => s + ((scores[r] ?? []).find((sc) => sc.judgeRole === role)?.blue ?? 0),
      0,
    );
    const redTotal = redSum - totalRedWarn;
    const blueTotal = blueSum - totalBlueWarn;

    if (redTotal === blueTotal) return undefined; // a judge card tied — too ambiguous to guess
    if (redTotal > blueTotal) redPicks++;
    else bluePicks++;
  }

  if (redPicks === 0 && bluePicks === 0) return undefined;

  const winner = redPicks > bluePicks ? "red" : "blue";
  const decision = redPicks === 0 || bluePicks === 0 ? "ud" : "sd";
  return { winner, decision };
};
