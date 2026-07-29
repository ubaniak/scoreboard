import type { CardStatus } from "../../entities/cards";

export type SortKey = "date" | "name" | "status";

export type CardFilters = {
  query: string;
  statuses: CardStatus[];
  dateFrom?: string;
  dateTo?: string;
  needsSetup?: boolean;
  sort: SortKey;
};

export const defaultCardFilters: CardFilters = {
  query: "",
  statuses: [],
  sort: "date",
};
