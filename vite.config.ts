import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // JSON.parse sur une chaîne est bien plus rapide à analyser qu'un énorme littéral objet, surtout sur téléphone.
  json: { stringify: true },
  build: {
    // Les cartes de chaque langue sont chargées à la demande (import dynamique) ; les personnages ont leur propre fichier.
    chunkSizeWarningLimit: 4000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'personnages', test: /personnages\.json/ }],
        },
      },
    },
  },
})
