import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark";

export type Palette = {
  bg: string;
  bgElevated: string;
  red: string;
  redMuted: string;
  blue: string;
  blueMuted: string;
  cornerRed: string;
  cornerBlue: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderSubtle: string;
};

export const palettes: Record<ThemeMode, Palette> = {
  dark: {
    bg: "#0b0f1a",
    bgElevated: "#131929",
    red: "#fca5a5",
    redMuted: "rgba(252,165,165,0.5)",
    blue: "#93c5fd",
    blueMuted: "rgba(147,197,253,0.5)",
    cornerRed: "#b91c1c",
    cornerBlue: "#1d4ed8",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.55)",
    textFaint: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.15)",
    borderSubtle: "rgba(255,255,255,0.08)",
  },
  light: {
    bg: "#f5f6fa",
    bgElevated: "#ffffff",
    red: "#dc2626",
    redMuted: "rgba(220,38,38,0.45)",
    blue: "#2563eb",
    blueMuted: "rgba(37,99,235,0.45)",
    cornerRed: "#b91c1c",
    cornerBlue: "#1d4ed8",
    text: "#0b0f1a",
    textMuted: "rgba(11,15,26,0.65)",
    textFaint: "rgba(11,15,26,0.45)",
    border: "rgba(11,15,26,0.18)",
    borderSubtle: "rgba(11,15,26,0.10)",
  },
};

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

export const cornerColor = (
  corner: "red" | "blue",
  colors: Palette,
): string => (corner === "red" ? colors.red : colors.blue);

export type ThemeContextValue = {
  mode: ThemeMode;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Allow components to render outside provider with dark default.
    return {
      mode: "dark",
      colors: palettes.dark,
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
};
