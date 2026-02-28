import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages';

  return {
    base: isPages ? process.env.PAGES_BASE ?? '/' : '/',
    build: isPages
      ? {
          outDir: 'dist-pages',
          emptyOutDir: true
        }
      : {
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
  };
});
