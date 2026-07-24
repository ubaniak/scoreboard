import type { Athlete } from "../../api/athletes";

const AGE_CATEGORY_ORDER = ["u13", "u15", "u17", "u19", "elite", "masters"];

const WEIGHT_TOLERANCE_KG = 3;

const AGE_CATEGORY_LABELS: Record<string, string> = {
  u13: "U13",
  u15: "U15",
  u17: "U17",
  u19: "U19",
  elite: "Elite",
  masters: "Masters",
};

export const matchWarnings = (red?: Athlete, blue?: Athlete): string[] => {
  if (!red || !blue) return [];

  const warnings: string[] = [];

  if (red.gender && blue.gender && red.gender !== blue.gender) {
    warnings.push(`Gender mismatch: ${red.gender} vs ${blue.gender}`);
  }

  if (red.experience && blue.experience && red.experience !== blue.experience) {
    warnings.push(`Experience mismatch: ${red.experience} vs ${blue.experience}`);
  }

  if (red.ageCategory && blue.ageCategory && red.ageCategory !== blue.ageCategory) {
    const redIndex = AGE_CATEGORY_ORDER.indexOf(red.ageCategory);
    const blueIndex = AGE_CATEGORY_ORDER.indexOf(blue.ageCategory);
    if (redIndex === -1 || blueIndex === -1 || Math.abs(redIndex - blueIndex) > 1) {
      const redLabel = AGE_CATEGORY_LABELS[red.ageCategory] ?? red.ageCategory;
      const blueLabel = AGE_CATEGORY_LABELS[blue.ageCategory] ?? blue.ageCategory;
      warnings.push(`Age category mismatch: ${redLabel} vs ${blueLabel}`);
    }
  }

  if (red.weightClass != null && blue.weightClass != null) {
    const diff = Math.abs(red.weightClass - blue.weightClass);
    if (diff > WEIGHT_TOLERANCE_KG) {
      warnings.push(
        `Weight mismatch: ${red.weightClass}kg vs ${blue.weightClass}kg (${diff.toFixed(1)}kg apart, tolerance is ${WEIGHT_TOLERANCE_KG}kg)`,
      );
    }
  }

  return warnings;
};
