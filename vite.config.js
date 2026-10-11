import {defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: ('./backend/key.pem'),
      cert: ('./backend/cert.pem'),
    },
    port: 5173,
  }
})