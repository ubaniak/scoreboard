import type { Dayjs } from "dayjs";

// Rules from features/age_cat_rules.md:
// U13=11-12, U15=13-14, U17=15-16, U19=17-18, Elite=19-39, Masters=40+
export function ageCategoryFromDOB(dob: Dayjs): string {
  const now = new Date();
  let age = now.getFullYear() - dob.year();
  const m = now.getMonth() - dob.month();
  if (m < 0 || (m === 0 && now.getDate() < dob.date())) age--;

  if (age <= 12) return "u13";
  if (age <= 14) return "u15";
  if (age <= 16) return "u17";
  if (age <= 18) return "u19";
  if (age <= 39) return "elite";
  return "masters";
}
