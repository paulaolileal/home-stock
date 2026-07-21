import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type ThemeMode } from "./ThemeContext";

const KEY = "hi.theme";
// Mirror --background (light/dark) from src/styles.css.
const THEME_COLOR_LIGHT = "#fafafa";
const THEME_COLOR_DARK = "#07090c";

function apply(mode: ThemeMode): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved: "light" | "dark" = mode === "system" ? (sysDark ? "dark" : "light") : mode;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);

  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as ThemeMode | null) ?? "system";
    setModeState(stored);
    setResolved(apply(stored));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(KEY) as ThemeMode | null) ?? "system";
      if (current === "system") setResolved(apply("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setMode = (m: ThemeMode) => {
    localStorage.setItem(KEY, m);
    setModeState(m);
    setResolved(apply(m));
  };

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>
  );
}
