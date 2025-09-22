import type { Config } from "tailwindcss";
import lineClamp from "@tailwindcss/line-clamp";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "kdh-deep-black": "#05060A",
        "kdh-charcoal": "#12131A",
        "kdh-neon-purple": "#A259FF",
        "kdh-electric-blue": "#3A86FF",
        "kdh-bloody-red": "#EF233C",
        "kdh-metallic-silver": "#ADB5BD",
        "kdh-ember": "#FF6D00",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Pretendard", "sans-serif"],
        display: ["var(--font-space)", "Space Grotesk", "Orbitron", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 35px rgba(162, 89, 255, 0.35)",
        banner: "0 15px 60px rgba(58, 134, 255, 0.25)",
      },
      backgroundImage: {
        "grid-overlay":
          "radial-gradient(circle at 20% 20%, rgba(58, 134, 255, 0.08), transparent 45%), radial-gradient(circle at 80% 30%, rgba(162, 89, 255, 0.08), transparent 55%)",
        "body-gradient":
          "linear-gradient(135deg, rgba(5, 6, 10, 0.95) 10%, rgba(18, 19, 26, 0.98) 40%, rgba(39, 14, 48, 0.92) 100%)",
      },
      keyframes: {
        ripple: {
          "0%": {
            transform: "scale(0.95)",
            boxShadow: "0 0 0 0 rgba(162, 89, 255, 0.6)",
          },
          "50%": {
            transform: "scale(1.01)",
            boxShadow:
              "0 0 35px 10px rgba(58, 134, 255, 0.5), 0 0 80px rgba(239, 35, 60, 0.25)",
          },
          "100%": {
            transform: "scale(0.97)",
            boxShadow: "0 0 0 0 rgba(162, 89, 255, 0.15)",
          },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        ripple: "ripple 1.8s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [lineClamp],
};

export default config;
