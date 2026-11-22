import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#FBF4EA", deep: "#F3E6D3", line: "#E6D5BE" },
        cocoa: { DEFAULT: "#3E2318", soft: "#6B4A3C", deep: "#2C180F" },
        // Single accent. White on pink = 5.05:1. On cocoa backgrounds use pink-light.
        // status dot only (open now); never used for text
        open: "#2F8A57",
        pink: { DEFAULT: "#C8336E", deep: "#A8255A", light: "#F4A6C2", wash: "#FBE3EC" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: { page: "1200px" },
      keyframes: {
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        sheet: { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
      },
      animation: {
        fade: "fade 220ms ease-out",
        sheet: "sheet 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
