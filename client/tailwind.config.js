/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#4ade80', 
          500: '#22c55e', 
          600: '#16a34a', 
        },
        dark: {
          800: '#1e1e1e', 
          900: '#121212', 
        }
      }
    },
  },
  plugins: [],
}