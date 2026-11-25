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
      // NODE_ENV=development publica la documentación de la API, que las pruebas comprueban.
      env: {
        ...env,
        NODE_ENV: "development",
        DATABASE_URL: getTestDatabaseUrl(env.DATABASE_URL),
      },
    },
  }
})
