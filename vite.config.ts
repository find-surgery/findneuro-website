import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
        shap: resolve(__dirname, 'src/shap/index.html'),
        'old-website': resolve(__dirname, 'src/old-website/index.html'),
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
