/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        card: "#1E293B",
        surface: "#1E293B",
        border: "#334155",
        credit: "#10B981",
        debit: "#EF4444",
        primary: "#38BDF8",
        accent: "#38BDF8",
        foreground: "#F8FAFC",
        muted: "#94A3B8",
      },
    },
  },
  plugins: [],
};
