import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Декораторы class-transformer/class-validator читают метаданные через
    // полифил Reflect; в работающем Nest его подключает сам фреймворк.
    setupFiles: ['reflect-metadata'],
  },
});
