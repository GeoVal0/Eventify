// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // 1. Κάνε import το plugin

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // 2. Πρόσθεσέ το στα plugins! Αυτό ενεργοποιεί το SSL/TLS στο localhost
  ]
})