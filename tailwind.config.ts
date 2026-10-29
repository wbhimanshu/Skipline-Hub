import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#F7F1E7",
          900: "#FFFCF6",
          850: "#F2E9DB",
          800: "#EFE3D0",
          700: "#E8D8C3",
          600: "#D9C4A6",
        },
        brand: {
          50: "#FBF6ED",
          100: "#F1E6D2",
          200: "#7A5A2E",
          300: "#8F6F3E",
          400: "#A98448",
          500: "#65452F",
          600: "#543824",
          700: "#432C1D",
          800: "#332116",
          900: "#2B1D14",
        },
        cyan: {
          100: "#8F6F3E",
          200: "#8F6F3E",
          300: "#8F6F3E",
          400: "#A98448",
          500: "#B08D53",
          600: "#8F6F3E",
        },
        cream: "#FFFCF6",
        white: "#2B1D14",
        slate: {
          50: "#FFFCF6",
          100: "#F7F1E7",
          200: "#E8D8C3",
          300: "#5F5147",
          400: "#786B60",
          500: "#8A7A6C",
          600: "#9C8B7B",
          700: "#B5A695",
          800: "#D9C9B5",
          900: "#E8D8C3",
          950: "#F2E9DB",
        },
        emerald: {
          100: "#4F6B4B",
          200: "#4F6B4B",
          300: "#5E7A5A",
          400: "#7C9678",
          500: "#5E7A5A",
          600: "#4A6448",
          700: "#3C533B",
        },
        rose: {
          100: "#9C4A33",
          200: "#9C4A33",
          300: "#B4553B",
          400: "#C46A50",
          500: "#B4553B",
          600: "#8E3B2A",
          700: "#733023",
        },
        amber: {
          100: "#8F6F3E",
          200: "#8F6F3E",
          300: "#A98448",
          400: "#C7A46A",
          500: "#B08D53",
          600: "#8F6F3E",
          700: "#755A30",
        },
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
        display: [
          "Plus Jakarta Sans Variable",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 18px 45px -18px rgba(101, 69, 47, 0.55)",
        "glow-cyan": "0 18px 45px -18px rgba(199, 164, 106, 0.45)",
        panel: "0 24px 70px -36px rgba(101, 69, 47, 0.35)",
        card: "0 14px 40px -28px rgba(101, 69, 47, 0.4)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(101,69,47,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(101,69,47,0.06) 1px, transparent 1px)",
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 11s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3.5s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin 14s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out both",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [forms],
};

export default config;
