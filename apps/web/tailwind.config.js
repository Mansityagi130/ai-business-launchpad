/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      colors: {
        brand: {
          bg: "#F7F5F0",
          surface: "#EFDAD7",
          primary: "#2F6966",
          dark: "#0F383A",
          accent: "#C9A674",
          text: "#151515",
        },
      },
    },
  },
  plugins: [],
};
