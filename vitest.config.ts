import { defineConfig, PluginOption } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

const importMetaDevPolyfill = (): PluginOption => ({
  name: 'import-meta-dev-polyfill',
  enforce: 'pre',
  transform(code) {
    if (!code.includes('import.meta.dev')) {
      return null;
    }

    return code.replaceAll(
      'import.meta.dev',
      '(process.env.NODE_ENV !== "production")',
    );
  },
});

export default defineConfig({
  plugins: [vue(), importMetaDevPolyfill()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
