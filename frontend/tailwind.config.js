/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F4EF",
        ink: "#0E1726",
        primary: {
          DEFAULT: "#1F63D6",
          hover: "#1752b8",
          light: "#EBF2FF",
        },
        accent: {
          DEFAULT: "#E8873A",
          hover: "#d4742a",
          light: "#FDF3EB",
        },
        dark: "#071525",
        muted: "#6B7280",
        border: "#E5E1D8",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ['"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        card: "16px",
        "card-lg": "20px",
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};
