import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reportsDirectory: "../../.coverage/contracts",
      reporter: ["text-summary", "html"],
      // Umbral común del proyecto (ver 09-decisiones.md).
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
})
