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

export type MismatchDimension = "gender" | "experience" | "ageCategory" | "weightClass";

export type Mismatch = {
  dimension: MismatchDimension;
  message: string;
  redValue: string;
  blueValue: string;
};

export const getMismatches = (red?: Athlete, blue?: Athlete): Mismatch[] => {
  if (!red || !blue) return [];

  const mismatches: Mismatch[] = [];

  if (red.gender && blue.gender && red.gender !== blue.gender) {
    mismatches.push({
      dimension: "gender",
      message: `Gender mismatch: ${red.gender} vs ${blue.gender}`,
      redValue: red.gender,
      blueValue: blue.gender,
    });
  }

  if (red.experience && blue.experience && red.experience !== blue.experience) {
    mismatches.push({
      dimension: "experience",
      message: `Experience mismatch: ${red.experience} vs ${blue.experience}`,
      redValue: red.experience,
      blueValue: blue.experience,
    });
  }

  if (red.ageCategory && blue.ageCategory && red.ageCategory !== blue.ageCategory) {
    const redIndex = AGE_CATEGORY_ORDER.indexOf(red.ageCategory);
    const blueIndex = AGE_CATEGORY_ORDER.indexOf(blue.ageCategory);
    if (redIndex === -1 || blueIndex === -1 || Math.abs(redIndex - blueIndex) > 1) {
      const redLabel = AGE_CATEGORY_LABELS[red.ageCategory] ?? red.ageCategory;
      const blueLabel = AGE_CATEGORY_LABELS[blue.ageCategory] ?? blue.ageCategory;
      mismatches.push({
        dimension: "ageCategory",
        message: `Age category mismatch: ${redLabel} vs ${blueLabel}`,
        redValue: red.ageCategory,
        blueValue: blue.ageCategory,
      });
    }
  }

  if (red.weightClass != null && blue.weightClass != null) {
    const diff = Math.abs(red.weightClass - blue.weightClass);
    if (diff > WEIGHT_TOLERANCE_KG) {
      mismatches.push({
        dimension: "weightClass",
        message: `Weight mismatch: ${red.weightClass}kg vs ${blue.weightClass}kg (${diff.toFixed(1)}kg apart, tolerance is ${WEIGHT_TOLERANCE_KG}kg)`,
        redValue: String(red.weightClass),
        blueValue: String(blue.weightClass),
      });
    }
  }

  return mismatches;
};
