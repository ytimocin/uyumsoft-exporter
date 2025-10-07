import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Sans'", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        surface: {
          base: "#0b1220",
          muted: "#111827",
          subtle: "rgba(17, 24, 39, 0.75)",
        },
      },
      boxShadow: {
        elevated: "0px 24px 48px rgba(13, 148, 136, 0.25)",
        card: "0px 16px 32px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(120% 120% at 0% 0%, rgba(59,130,246,0.25) 0%, rgba(14,116,144,0.25) 35%, rgba(12,74,110,0.1) 70%, rgba(15,23,42,1) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
