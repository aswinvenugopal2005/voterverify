/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          dark: '#0f172a',    // Dark navy sidebar
          surface: '#1e293b', // Sidebar hover / card
          border: '#334155',
          blue: '#1d4ed8',   // National cobalt blue
          lightBlue: '#2563eb',
          accent: '#0284c7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
