export const colors = {
  bg: "#0b0f1a",
  red: "#fca5a5",
  redMuted: "rgba(252,165,165,0.5)",
  blue: "#93c5fd",
  blueMuted: "rgba(147,197,253,0.5)",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.15)",
  borderSubtle: "rgba(255,255,255,0.08)",
} as const;

export const type = {
  caption: 12,
  body: 16,
  h3: 22,
  h2: 32,
  h1: 56,
  display: 96,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const tracking = {
  caps: "0.2em",
} as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  judge1: "Judge 1",
  judge2: "Judge 2",
  judge3: "Judge 3",
  judge4: "Judge 4",
  judge5: "Judge 5",
};

export const formatRole = (role: string): string =>
  ROLE_LABELS[role] ?? role;

export const cornerColor = (corner: "red" | "blue"): string =>
  corner === "red" ? colors.red : colors.blue;
