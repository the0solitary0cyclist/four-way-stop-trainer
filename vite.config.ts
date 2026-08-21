import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub Pages serves project sites from /<repository-name>/.
  // Set VITE_BASE_PATH=/ for a user/organization site or custom domain.
  base: process.env.VITE_BASE_PATH || (mode === 'production' ? '/four-way-stop-trainer/' : '/'),
}))
