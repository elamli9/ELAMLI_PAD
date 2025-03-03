import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ELAMLI_PAD/', // ✅ Add a leading slash
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
