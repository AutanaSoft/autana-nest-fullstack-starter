import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

import { getTestDatabaseUrl } from "./test/support/test-database-url.js"

export default defineConfig(({ mode }) => {
  // `loadEnv` no escribe en `process.env`: las variables de .env llegan a las pruebas mediante `test.env`.
  const env = loadEnv(mode, import.meta.dirname, "")

  return {
    resolve: { tsconfigPaths: true },
    test: {
      globals: true,
      root: "./",
      include: ["**/*.e2e-spec.ts"],
      globalSetup: "./test/support/global-setup.ts",
      coverage: {
        enabled: true,
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.spec.ts", "src/main.ts"],
        reportsDirectory: "../../.coverage/api/e2e",
        reporter: ["text-summary", "html"],
        // Umbral común del proyecto (ver 09-decisiones.md).
        thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
      },
      // NODE_ENV=development publica la documentación de la API, que las pruebas comprueban.
      env: {
        ...env,
        NODE_ENV: "development",
        DATABASE_URL: getTestDatabaseUrl(env.DATABASE_URL),
      },
    },
  }
})
