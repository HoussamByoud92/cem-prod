import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    process.env.VERCEL ? [] : build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  build: process.env.VERCEL ? {
    // Build a dummy placeholder to clear the server code from static output
    lib: {
      entry: 'src/deploy-placeholder.ts',
      formats: ['es'],
      fileName: 'deploy-placeholder'
    },
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true
  } : undefined
})
