import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#FBF4EA", deep: "#F3E6D3", line: "#E6D5BE" },
        cocoa: { DEFAULT: "#3E2318", soft: "#6B4A3C", deep: "#2C180F" },
        // Single accent. White on pink = 5.05:1. On cocoa backgrounds use pink-light.
        pink: { DEFAULT: "#C8336E", deep: "#A8255A", light: "#F4A6C2", wash: "#FBE3EC" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: { page: "1200px" },
    },
  },
  plugins: [],
} satisfies Config;
