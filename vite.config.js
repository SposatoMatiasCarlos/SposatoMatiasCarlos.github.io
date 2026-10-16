import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Usate solo da pagine caricate in lazy: senza questo Vite le scopre
    // all'apertura della pagina, le ricompila e l'import dinamico fallisce.
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
})
