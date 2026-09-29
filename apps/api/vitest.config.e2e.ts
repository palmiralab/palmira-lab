import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Декораторы class-transformer/class-validator читают метаданные через
    // полифил Reflect; в работающем Nest его подключает сам фреймворк.
    setupFiles: ['reflect-metadata'],
  },
});
