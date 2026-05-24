/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#2563eb', // Biru untuk tombol aksi utama
        'medical-green': '#16a34a', // Hijau untuk status Non-Referable
        'medical-red': '#dc2626', // Merah untuk status Referable (Kritis)
      }
    },
  },
  plugins: [],
}