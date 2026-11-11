import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [react(), viteStaticCopy({
    targets: ['Workers', 'Assets', 'ThirdParty', 'Widgets'].map((directory) => ({
      src: `node_modules/cesium/Build/Cesium/${directory}`,
      dest: 'cesium',
    })),
  })],
  define: { CESIUM_BASE_URL: JSON.stringify('/cesium') },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
  },
});
