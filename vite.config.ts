import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  base: './',
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('xlsx') || id.includes('file-saver')) return 'vendor-excel';
            if (id.includes('docx')) return 'vendor-docx';
            return 'vendor-core';
          }
        }
      }
    }
  }
});
