import { defineConfig } from "vitest/config"

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: "./",
    include: ["**/*.spec.ts"],
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/main.ts"],
      reportsDirectory: "../../.coverage/api/unit",
      reporter: ["text-summary", "html"],
      // Sin umbral: los servicios que consultan la base se cubren en integración.
    },
  },
})
