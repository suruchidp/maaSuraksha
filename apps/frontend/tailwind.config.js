import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default {
  content: {
    relative: true,
    files: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@maasuraksha/shared/src/**/*.{js,ts,tsx}",
    ],
  },
  theme: {
    extend: {
      colors: {
        /* Warm dusty rose — the primary MaaSuraksha brand tone */
        primary: {
          50: "#fdf2f7",
          100: "#fbe4ee",
          200: "#f6c9dc",
          300: "#efa4c2",
          400: "#e577a2",
          500: "#d95588",
          600: "#c2436f",
          700: "#a1355c",
          800: "#852e4e",
          900: "#6e2940",
        },
        /* Muted sage green — the calm secondary accent */
        accent: {
          50: "#f2f6f1",
          100: "#e3ece1",
          200: "#c7d9c3",
          300: "#a5bf9f",
          400: "#7fa378",
          500: "#5f8859",
          600: "#4a6f46",
          700: "#3d5a3a",
          800: "#324a31",
          900: "#2a3d29",
        },
        /* Soft peach — companion tone to the rose family */
        peach: {
          50: "#fff7ef",
          100: "#feecdb",
          200: "#fcd8b4",
          300: "#f9bf85",
          400: "#f5a35b",
          500: "#f08a3e",
          600: "#e07125",
          700: "#b95a1c",
          800: "#94491d",
          900: "#783c1a",
        },
        /* Gentle lavender — used in highlight panels and headers */
        lavender: {
          50: "#f7f4fc",
          100: "#efe8f9",
          200: "#dfd1f2",
          300: "#c6b0e7",
          400: "#a98ada",
          500: "#8f6bc9",
          600: "#7a54b4",
          700: "#674497",
          800: "#533a7a",
          900: "#453264",
        },
        /* Warm cream — page backgrounds and soft fills */
        cream: {
          50: "#fdf9f3",
          100: "#fbf3e8",
          200: "#f5e7d4",
          300: "#eee0c1",
          400: "#dcc6a5",
          500: "#c8ac86",
          600: "#b39674",
          700: "#8f7660",
          800: "#715d4d",
          900: "#5c4a3f",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans Devanagari",
          "Noto Sans Kannada",
          "sans-serif",
        ],
        display: ["Fraunces", "Noto Serif Devanagari", "Noto Serif Kannada", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(194, 67, 111, 0.25)",
        card: "0 1px 2px rgba(194, 67, 111, 0.05), 0 14px 34px -18px rgba(194, 67, 111, 0.22)",
      },
      backgroundImage: {
        /* Two warm gradients reused across hero and highlight panels */
        "maternal-sheen":
          "linear-gradient(135deg, #fdf2f7 0%, #fdf9f3 45%, #fff7ef 92%)",
        "maternal-hero":
          "linear-gradient(120deg, #fbe4ee 0%, #ffe9cd 52%, #efe8f9 100%)",
      },
    },
  },
  plugins: [],
};
