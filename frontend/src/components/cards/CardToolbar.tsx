import { Input, Select } from "antd";
import type { CardStatus } from "../../entities/cards";
import { radius, space, useTheme } from "../../theme";
import { defaultCardFilters, type CardFilters, type SortKey } from "./cardFilters";

const nextWeekendRange = (): { from: string; to: string } => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toIso(saturday), to: toIso(sunday) };
};

type Preset = {
  key: string;
  label: string;
  matches: (f: CardFilters) => boolean;
  apply: () => CardFilters;
};

const presets: Preset[] = [
  {
    key: "live",
    label: "Live Now",
    matches: (f) => f.statuses.length === 1 && f.statuses[0] === "in_progress" && !f.dateFrom,
    apply: () => ({ ...defaultCardFilters, statuses: ["in_progress"] }),
  },
  {
    key: "weekend",
    label: "This Weekend",
    matches: (f) => !!f.dateFrom && !f.statuses.length,
    apply: () => {
      const { from, to } = nextWeekendRange();
      return { ...defaultCardFilters, dateFrom: from, dateTo: to };
    },
  },
  {
    key: "upcoming",
    label: "Upcoming",
    matches: (f) => f.statuses.length === 1 && f.statuses[0] === "upcoming" && !f.dateFrom,
    apply: () => ({ ...defaultCardFilters, statuses: ["upcoming"] }),
  },
  {
    key: "needs-setup",
    label: "Needs Setup",
    matches: (f) => !!f.needsSetup,
    apply: () => ({ ...defaultCardFilters, statuses: ["upcoming"], needsSetup: true }),
  },
  {
    key: "archive",
    label: "Archive",
    matches: (f) => f.statuses.length === 2 && f.statuses.includes("completed") && f.statuses.includes("cancelled"),
    apply: () => ({ ...defaultCardFilters, statuses: ["completed", "cancelled"] }),
  },
];

const statusOptions: { label: string; value: CardStatus }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export type CardToolbarProps = {
  filters: CardFilters;
  onChange: (filters: CardFilters) => void;
};

export const CardToolbar = ({ filters, onChange }: CardToolbarProps) => {
  const { colors } = useTheme();

  return (
    <div style={{ marginBottom: space.md }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: space.sm,
          alignItems: "center",
          background: colors.bgElevated,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: radius.lg,
          padding: space.md,
          boxShadow: colors.shadowSm,
          marginBottom: space.sm,
        }}
      >
        <Input.Search
          placeholder="Search cards by name…"
          allowClear
          style={{ flex: "1 1 220px" }}
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
        <Select
          mode="multiple"
          placeholder="Status"
          style={{ minWidth: 180 }}
          options={statusOptions}
          value={filters.statuses}
          onChange={(statuses) => onChange({ ...filters, statuses })}
          maxTagCount="responsive"
        />
        <Select
          style={{ minWidth: 140, marginLeft: "auto" }}
          value={filters.sort}
          onChange={(sort: SortKey) => onChange({ ...filters, sort })}
          options={[
            { label: "Sort: Date", value: "date" },
            { label: "Sort: Name", value: "name" },
            { label: "Sort: Status", value: "status" },
          ]}
        />
      </div>

      <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap" }}>
        {presets.map((preset) => {
          const active = preset.matches(filters);
          return (
            <button
              key={preset.key}
              onClick={() => onChange(active ? defaultCardFilters : preset.apply())}
              style={{
                padding: "6px 14px",
                borderRadius: radius.pill,
                fontSize: 13,
                cursor: "pointer",
                border: active ? `1px solid ${colors.blue}` : `1px dashed ${colors.border}`,
                background: active ? colors.blueMuted : "transparent",
                color: active ? colors.blue : colors.textFaint,
                fontWeight: active ? 500 : 400,
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
