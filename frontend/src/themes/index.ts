export interface Theme {
  name: string;
  label: string;
  accent: string;
  accentRgb: string;
  accentHover: string;
  accentMuted: string;
}

export const themes: Record<string, Theme> = {
  "cyber-green": {
    name: "cyber-green",
    label: "Cyber Green",
    accent: "#00FF88",
    accentRgb: "0, 255, 136",
    accentHover: "#00CC6E",
    accentMuted: "#00FF8820",
  },
  "electric-blue": {
    name: "electric-blue",
    label: "Electric Blue",
    accent: "#0066FF",
    accentRgb: "0, 102, 255",
    accentHover: "#0052CC",
    accentMuted: "#0066FF20",
  },
  "red-alert": {
    name: "red-alert",
    label: "Red Alert",
    accent: "#FF3344",
    accentRgb: "255, 51, 68",
    accentHover: "#CC2937",
    accentMuted: "#FF334420",
  },
};

export const defaultTheme = themes["cyber-green"];

export function applyTheme(themeName: string): void {
  const theme = themes[themeName] || defaultTheme;
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-rgb", theme.accentRgb);
  root.style.setProperty("--accent-hover", theme.accentHover);
  root.style.setProperty("--accent-muted", theme.accentMuted);
}
