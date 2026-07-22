/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff5ff", 100: "#dbe7fe", 200: "#bfd3fe", 300: "#93b4fd",
          400: "#608dfa", 500: "#3b6bf6", 600: "#1D4ED8", 700: "#1e40af",
          800: "#1e3a8a", 900: "#1e336e",
        },
        ink: "#0f172a",
        muted: "#64748b",
        surface: "#F4F7FB",
        line: "#E6ECF4",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#EF4444",
        purple: "#7C3AED",
        teal: "#0D9488",
      },
      fontFamily: {
        sans: ["IBM Plex Sans Thai", "Inter", "Noto Sans Thai", "system-ui", "sans-serif"],
        num: ["Inter", "IBM Plex Sans Thai", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 16px rgba(16,24,40,.06)",
        cardHover: "0 12px 32px rgba(16,24,40,.12)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-up": "fade-up .35s ease both",
      },
    },
  },
  plugins: [],
};
