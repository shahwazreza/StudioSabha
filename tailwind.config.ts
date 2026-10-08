import type { Config } from "tailwindcss";

// Tokens from the Modernist design system ("The Catalogue" mockups).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3f2f2", // --color-bg
        surface: "#eae9e9", // --color-surface
        ink: "#201e1d", // --color-text
        rule: "rgb(32 30 29 / 0.4)", // --color-divider
        accent: {
          DEFAULT: "#ec3013",
          100: "#fff2ef",
          600: "#dd2b0f",
          700: "#ae1800", // use for small red text (contrast)
          800: "#7c1405",
        },
        neutral: {
          100: "#f8f4f4",
          300: "#d7d3d3",
          800: "#444141",
        },
      },
      fontFamily: {
        // The var() fallback keeps text in a clean sans-serif even if the web font
        // fails to load (instead of the browser default, Times New Roman).
        sans: ["var(--font-archivo, system-ui)", "system-ui", "sans-serif"],
      },
      borderWidth: {
        3: "3px",
      },
      letterSpacing: {
        kicker: "0.12em",
      },
      maxWidth: {
        prose: "68ch",
        page: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
