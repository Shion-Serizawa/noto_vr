import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// GitHub Pagesでのデプロイ時に使用する正しいベースパス
// リポジトリ名がプロジェクト名と同じ場合、'/360-viewer/'を使用します
// もしルートドメインを使用する場合は、'/'を設定します
const base = process.env.NODE_ENV === 'production' ? '/360-viewer/' : '/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: base,
  // A-Frameとの互換性のための設定
  optimizeDeps: {
    include: ['aframe'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})