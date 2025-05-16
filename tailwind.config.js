/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: { themes: ["light"] }, // or your preferred theme
};
