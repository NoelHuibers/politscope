import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
      "api/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".output",
      ".vercel",
      "playwright-report",
      "test-results",
      "tests/e2e/**",
      "src/paraglide/**",
    ],
    isolate: true,
    pool: "threads",
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
      include: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "tests/**/*.{test,spec}.{ts,tsx}",
        "api/**/*.{test,spec}.{ts,tsx}",
      ],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/paraglide/**",
        "src/routeTree.gen.ts",
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",
        "src/routes/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    unstubEnvs: true,
    unstubGlobals: true,
    sequence: { shuffle: true },
    passWithNoTests: true,
    onConsoleLog(log, type) {
      throw new Error(`Unexpected console.${type} during tests:\n${log}`);
    },
  },
});
