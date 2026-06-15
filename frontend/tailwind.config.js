/** @type {import('tailwindcss').Config} */
module.exports = 
{
  content: ["./*.html", "./components/**/*.html", "./js/**/*.js", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#8b5a2b",
        secondary: "#d4af37",
        accent: "#f5f5f5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      screens: {
        tablet: "640px",
        laptop: "1024px",
        desktop: "1280px",
      },
      spacing: {
        '4': '0rem',  /* gap-4 módosítása 0rem-re */
        '5': '0.75rem',  /* gap-5 módosítása 0.75rem-re */
        '6': '1rem',     /* gap-6 módosítása 1rem-re */
    },
  },
  plugins: [],
},
};
