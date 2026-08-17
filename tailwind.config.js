/**
 * NativeWind v4 config.
 * NativeWind is used ONLY for layout utilities (flex / align / justify / gap).
 * All colors, typography, spacing and sizing live in src/theme + StyleSheet.
 * The tokens below are mirrored from src/theme so class-based layout stays
 * consistent, but visual styling should prefer StyleSheet.create().
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#DDB7FF',
        'primary-dark': '#B76DFF',
        background: '#141122',
        surface: '#201D2F',
      },
    },
  },
  plugins: [],
};
