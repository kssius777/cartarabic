import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // JSON.parse sur une chaîne est bien plus rapide à analyser qu'un énorme littéral objet, surtout sur téléphone.
  json: { stringify: true },
  build: {
    // Les données (17 000 cartes, 1 000 personnages) vont dans leurs propres fichiers, téléchargés en parallèle du code.
    chunkSizeWarningLimit: 4000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'cartes', test: /cartes\.json/ },
            { name: 'personnages', test: /personnages\.json/ },
          ],
        },
      },
    },
  },
})
