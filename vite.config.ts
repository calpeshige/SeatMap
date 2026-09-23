import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: 'electron/main.ts',
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            rollupOptions: {
              // Electron の ESM preload は .mjs 拡張子が必須（.js だと type:module で読み込み失敗）
              output: { entryFileNames: 'preload.mjs' },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
})
