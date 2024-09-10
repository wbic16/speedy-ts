import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: { external: ['libphext'] }
  },
  optimizeDeps: {
    include: ["@libphext"]
  }
});
