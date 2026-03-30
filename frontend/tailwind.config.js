/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "#06060F",
        "bg-surface": "#09090F",
        "bg-card": "#0C0C1A",
        "bg-hover": "#111122",
        "accent-green": "#00FF88",
        "accent-blue": "#0066FF",
        "accent-red": "#FF3344",
        "accent-amber": "#FFB800",
        "text-primary": "#F0F0F8",
        "text-secondary": "#8080AA",
        "text-muted": "#404068",
        border: "#161628",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
