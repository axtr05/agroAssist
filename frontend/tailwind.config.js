/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  // ADD THIS PLUGINS SECTION
  plugins: [
    require('@tailwindcss/typography'),
  ],
};