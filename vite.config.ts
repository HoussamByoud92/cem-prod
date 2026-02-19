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
    ssr: 'src/index.tsx',
    outDir: 'dist',
    emptyOutDir: true
  } : undefined
})
