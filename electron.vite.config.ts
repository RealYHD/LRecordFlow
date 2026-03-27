import { defineConfig } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      bytecode: true
    }
  },
  preload: {
    build: {
      bytecode: true
    }
  },
  renderer: {
    plugins: [tailwindcss(), svelte()]
  }
})
