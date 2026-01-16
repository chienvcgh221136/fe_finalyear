/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main brand color (Sky Blue - often used for primary buttons)
        primary: "#0ea5e9", // sky-500
        "primary-hover": "#0284c7", // sky-600

        // Deep blue for headings/accents
        secondary: "#1857de",
        "secondary-text": "#315fac",

        // Backgrounds
        background: "#f8f9fa",
        surface: "#ffffff",

        // Text
        "text-main": "#1a1a1a",
        "text-muted": "#666666",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
