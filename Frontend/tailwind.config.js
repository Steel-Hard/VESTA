/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas para o VESTA
        vesta: {
          primary: '#2563eb',    // Azul principal
          secondary: '#059669',  // Verde para status "seguro"
          danger: '#dc2626',     // Vermelho para alertas
          warning: '#d97706',    // Laranja para avisos
        }
      }
    },
  },
  plugins: [],
}