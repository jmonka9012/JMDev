import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import generateSitemap from 'vite-ssg-sitemap'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  css: {
    preprocessorOptions: {
      scss: { additionalData: `@use "@/SCSS/_variables.scss" as *; @use "@/SCSS/_helpers.scss" as *;` }
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  ssr: { external: ['p5'] },

  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    dispatchBeforeFinished: true,
    async includedRoutes(paths) {
      const routesPath = path.resolve(__dirname, 'public/data/routes.json');
      let generatedRoutes = [];

      if (fs.existsSync(routesPath)) {
        generatedRoutes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
      }

      const staticPaths = paths.filter(p => !p.includes(':'));
      return [...staticPaths, ...generatedRoutes];
    },
    onFinished() {
      generateSitemap({
        hostname: 'https://jmdev.pl',
      })
    }
  }
})