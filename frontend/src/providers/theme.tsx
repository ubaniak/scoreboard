import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, palettes, type ThemeMode } from "../theme";

const STORAGE_KEY = "scoreboard:themeMode";

const readInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore quota / privacy-mode failures
    }
  };

  const toggle = () => setMode(mode === "dark" ? "light" : "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const value = useMemo(
    () => ({ mode, colors: palettes[mode], setMode, toggle }),
    [mode], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
