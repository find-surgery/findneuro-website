import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        },
        paths: {
          three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js'
        }
      }
    }
  },
  resolve: {
    alias: {
      three: 'three'
    }
  }
});
