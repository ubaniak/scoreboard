import type { CreateAthleteProps } from "../../api/athletes";

type RawValues = CreateAthleteProps & { dateOfBirth?: unknown };

export const toCreateAthleteProps = (v: RawValues): CreateAthleteProps => ({
  name: v.name,
  ageCategory: v.ageCategory,
  gender: v.gender,
  experience: v.experience,
  clubAffiliationId: v.clubAffiliationId,
  provinceAffiliationId: v.provinceAffiliationId,
  nationAffiliationId: v.nationAffiliationId,
  weightClass: v.weightClass,
});
