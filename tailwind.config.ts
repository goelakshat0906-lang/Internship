import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        volt: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
        ink: {
          950: "#05060a",
          900: "#0b0e14",
          800: "#11151f",
          700: "#171c29",
          600: "#232a3b",
          500: "#323b52",
          400: "#525d7a",
          300: "#7c869e",
          200: "#aab1c2",
          100: "#d6dae3",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(250,204,21,0.15), 0 8px 24px -8px rgba(250,204,21,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
