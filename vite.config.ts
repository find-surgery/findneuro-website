import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        'cn-suite-paper': resolve(__dirname, 'src/cn-suite-paper/index.html'),
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
