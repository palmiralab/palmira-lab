import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Алиас `@/` из tsconfig.json нужен и в тестах.
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
