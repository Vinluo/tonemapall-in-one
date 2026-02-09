import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.ts',
      name: 'WebglLinearBaseline',
      formats: ['es', 'iife'],
      fileName: (format) => `webgl-linear-baseline.${format}.js`
    }
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts']
  }
});
