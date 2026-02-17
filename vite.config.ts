import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        dev: resolve(__dirname, 'src/index-dev.html'),
      },
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
